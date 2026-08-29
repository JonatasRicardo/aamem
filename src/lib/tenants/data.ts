import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { unstable_cache } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import {
  detectLogoImageType,
  LOGO_MAX_BYTES,
  logoContentType,
  logoExtension,
} from "@/lib/images";
import { normalizePhoneDigits } from "@/lib/phone";
import { tenantPathTag, tenantTag } from "@/lib/tenants/cache-tags";
import { isValidTenantSlug } from "@/lib/tenants/paths";

export const PRAYER_REQUEST_MIN_LENGTH = 3;
export const PRAYER_REQUEST_MAX_LENGTH = 2000;
export const PRAYER_CONTACT_NAME_MAX_LENGTH = 120;
export const CONTACT_TOKEN_TTL_MS = 30 * 60 * 1000;

export type TenantStatus = "draft" | "published";

export type TenantConfig = {
  tenant: string;
  status: TenantStatus;
  ownerUid: string;
  institutionName: string;
  description: string;
  themeId: string;
  logoPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
};

export type TenantPage = {
  id: string;
  path: string;
  status: TenantStatus;
  title: string;
  description: string;
  blocks: Array<Record<string, unknown>>;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
};

export type PublishedBuildPage = {
  tenant: string;
  path: string;
};

export type PrayerRequest = {
  id: string;
  message: string;
  status: string;
  wantsContact: boolean;
  contactName?: string;
  contactWhatsapp?: string;
  createdAt?: Date;
  contactUpdatedAt?: Date;
};

/** Bad input from a caller. Routes map this to a 400. */
export class ValidationError extends Error {}

export class TenantError extends Error {
  constructor(
    message: string,
    public code:
      | "invalid-tenant"
      | "reserved-tenant"
      | "tenant-taken"
      | "not-found"
      | "forbidden"
  ) {
    super(message);
  }
}

function timestampToDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

function tenantFromSnapshot(
  snapshot: FirebaseFirestore.DocumentSnapshot
): TenantConfig | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() ?? {};

  return {
    tenant: String(data.tenant ?? snapshot.id),
    status: data.status === "published" ? "published" : "draft",
    ownerUid: String(data.ownerUid ?? ""),
    institutionName: String(data.institutionName ?? ""),
    description: String(data.description ?? ""),
    themeId: String(data.themeId ?? "rose"),
    logoPath: typeof data.logoPath === "string" ? data.logoPath : undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    publishedAt: timestampToDate(data.publishedAt),
  };
}

function pageFromSnapshot(
  snapshot: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): TenantPage | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    path: String(data.path ?? "/"),
    status: data.status === "published" ? "published" : "draft",
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    publishedAt: timestampToDate(data.publishedAt),
  };
}

function prayerRequestFromSnapshot(
  snapshot: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): PrayerRequest | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    message: String(data.message ?? ""),
    status: String(data.status ?? "new"),
    wantsContact: Boolean(data.wantsContact),
    contactName:
      typeof data.contactName === "string" && data.contactName
        ? data.contactName
        : undefined,
    contactWhatsapp:
      typeof data.contactWhatsapp === "string" && data.contactWhatsapp
        ? data.contactWhatsapp
        : undefined,
    createdAt: timestampToDate(data.createdAt),
    contactUpdatedAt: timestampToDate(data.contactUpdatedAt),
  };
}

function assertTenantSlug(tenant: string) {
  if (!isValidTenantSlug(tenant)) {
    throw new TenantError("Tenant invalido.", "invalid-tenant");
  }
}

function hashContactToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function matchesContactToken(token: string, storedHash: unknown) {
  if (typeof storedHash !== "string" || storedHash.length !== 64) {
    return false;
  }

  const provided = Buffer.from(hashContactToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");

  return provided.length === stored.length && timingSafeEqual(provided, stored);
}

async function getTenantConfigUncached(tenant: string) {
  assertTenantSlug(tenant);
  const snapshot = await getAdminDb().collection("tenants").doc(tenant).get();
  return tenantFromSnapshot(snapshot);
}

async function getTenantPageUncached(tenant: string, path: string) {
  assertTenantSlug(tenant);

  const snapshot = await getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("pages")
    .where("path", "==", path)
    .limit(1)
    .get();

  return snapshot.empty ? null : pageFromSnapshot(snapshot.docs[0]!);
}

export function getTenantConfig(tenant: string) {
  return unstable_cache(
    () => getTenantConfigUncached(tenant),
    ["tenant-config", tenant],
    {
      revalidate: 300,
      tags: [tenantTag(tenant)],
    }
  )();
}

export function getTenantPage(tenant: string, path: string) {
  return unstable_cache(
    () => getTenantPageUncached(tenant, path),
    ["tenant-page", tenant, path],
    {
      revalidate: 300,
      tags: [tenantTag(tenant), tenantPathTag(tenant, path)],
    }
  )();
}

export async function getAllPublishedPagesForBuild(): Promise<
  PublishedBuildPage[]
> {
  const snapshot = await getAdminDb()
    .collectionGroup("pages")
    .where("status", "==", "published")
    .get();

  return snapshot.docs.flatMap((doc) => {
    const tenant = doc.ref.parent.parent?.id;
    const path = String(doc.data().path ?? "/");

    return tenant ? [{ tenant, path }] : [];
  });
}

export async function isTenantAvailable(tenant: string) {
  if (!isValidTenantSlug(tenant)) {
    return false;
  }

  const snapshot = await getAdminDb().collection("tenants").doc(tenant).get();
  return !snapshot.exists;
}

export async function createDraftTenant({
  tenant,
  ownerUid,
  institutionName,
  description,
  themeId,
}: {
  tenant: string;
  ownerUid: string;
  institutionName?: string;
  description?: string;
  themeId?: string;
}) {
  assertTenantSlug(tenant);

  const db = getAdminDb();
  const tenantRef = db.collection("tenants").doc(tenant);
  const homePageRef = tenantRef.collection("pages").doc("home");
  const prayerPageRef = tenantRef.collection("pages").doc("pedido-de-oracao");

  await db.runTransaction(async (transaction) => {
    const existingTenant = await transaction.get(tenantRef);

    if (existingTenant.exists) {
      throw new TenantError("Este link ja esta em uso.", "tenant-taken");
    }

    const now = FieldValue.serverTimestamp();
    const name = institutionName?.trim() || "Minha igreja";
    const bio =
      description?.trim() ||
      "Um espaço simples para receber pedidos de oração e caminhar junto em fé.";
    const selectedTheme = themeId?.trim() || "rose";

    transaction.set(tenantRef, {
      tenant,
      status: "draft",
      ownerUid,
      institutionName: name,
      description: bio,
      themeId: selectedTheme,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });

    transaction.set(homePageRef, {
      path: "/",
      status: "draft",
      title: name,
      description: bio,
      blocks: [{ type: "institution-bio" }],
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });

    transaction.set(prayerPageRef, {
      path: "/pedido-de-oracao",
      status: "draft",
      title: "Pedido de oração",
      description: "Receba pedidos de oração da sua comunidade.",
      blocks: [{ type: "prayer-request-form" }],
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });
  });

  return tenant;
}

export async function listOwnerTenants(ownerUid: string) {
  const snapshot = await getAdminDb()
    .collection("tenants")
    .where("ownerUid", "==", ownerUid)
    .get();

  return snapshot.docs
    .map((doc) => tenantFromSnapshot(doc))
    .filter((tenant): tenant is TenantConfig => Boolean(tenant))
    .sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
}

export async function listAllTenants() {
  const snapshot = await getAdminDb().collection("tenants").get();

  return snapshot.docs
    .map((doc) => tenantFromSnapshot(doc))
    .filter((tenant): tenant is TenantConfig => Boolean(tenant))
    .sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
}

export async function listOwnerPrayerRequests({
  tenant,
  ownerUid,
  canAccessAllTenants = false,
}: {
  tenant: string;
  ownerUid: string;
  canAccessAllTenants?: boolean;
}) {
  await getOwnerTenant(tenant, ownerUid, canAccessAllTenants);

  const snapshot = await getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("prayerRequests")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs
    .map((doc) => prayerRequestFromSnapshot(doc))
    .filter((request): request is PrayerRequest => Boolean(request));
}

export async function deleteOwnerTenants(ownerUid: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collection("tenants")
    .where("ownerUid", "==", ownerUid)
    .get();
  const logoPaths = snapshot.docs
    .map((doc) => doc.data().logoPath)
    .filter((logoPath): logoPath is string => typeof logoPath === "string");
  const tenants = snapshot.docs.map((doc) => doc.id);

  for (const doc of snapshot.docs) {
    await db.recursiveDelete(doc.ref);
  }

  const bucket = getAdminStorage().bucket();

  await Promise.all(
    logoPaths.map((logoPath) => bucket.file(logoPath).delete().catch(() => null))
  );

  return tenants;
}

export async function getOwnerTenant(
  tenant: string,
  ownerUid: string,
  canAccessAllTenants = false
) {
  assertTenantSlug(tenant);
  const config = await getTenantConfigUncached(tenant);

  if (!config) {
    throw new TenantError("Minisite nao encontrado.", "not-found");
  }

  if (!canAccessAllTenants && config.ownerUid !== ownerUid) {
    throw new TenantError("Voce nao pode alterar este minisite.", "forbidden");
  }

  return config;
}

export async function updateTenantPage({
  tenant,
  ownerUid,
  canAccessAllTenants = false,
  path,
  title,
  description,
  blocks,
}: {
  tenant: string;
  ownerUid: string;
  canAccessAllTenants?: boolean;
  path: string;
  title?: string;
  description?: string;
  blocks?: Array<Record<string, unknown>>;
}) {
  await getOwnerTenant(tenant, ownerUid, canAccessAllTenants);

  const snapshot = await getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("pages")
    .where("path", "==", path)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new TenantError("Pagina nao encontrada.", "not-found");
  }

  await snapshot.docs[0]!.ref.update({
    ...(title ? { title } : null),
    ...(description ? { description } : null),
    ...(blocks ? { blocks } : null),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateTenantConfig({
  tenant,
  ownerUid,
  canAccessAllTenants = false,
  institutionName,
  description,
  themeId,
}: {
  tenant: string;
  ownerUid: string;
  canAccessAllTenants?: boolean;
  institutionName?: string;
  description?: string;
  themeId?: string;
}) {
  await getOwnerTenant(tenant, ownerUid, canAccessAllTenants);

  const cleanInstitutionName = institutionName?.trim();
  const cleanDescription = description?.trim();
  const cleanThemeId = themeId?.trim();
  const tenantPatch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  const homePatch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (cleanInstitutionName) {
    tenantPatch.institutionName = cleanInstitutionName;
    homePatch.title = cleanInstitutionName;
  }

  if (cleanDescription) {
    tenantPatch.description = cleanDescription;
    homePatch.description = cleanDescription;
  }

  if (cleanThemeId) {
    tenantPatch.themeId = cleanThemeId;
  }

  const db = getAdminDb();
  const tenantRef = db.collection("tenants").doc(tenant);
  const batch = db.batch();

  batch.update(tenantRef, tenantPatch);

  if (homePatch.title || homePatch.description) {
    batch.update(tenantRef.collection("pages").doc("home"), homePatch);
  }

  await batch.commit();
}

export async function publishTenantPages({
  tenant,
  ownerUid,
  canAccessAllTenants = false,
}: {
  tenant: string;
  ownerUid: string;
  canAccessAllTenants?: boolean;
}) {
  await getOwnerTenant(tenant, ownerUid, canAccessAllTenants);

  const db = getAdminDb();
  const tenantRef = db.collection("tenants").doc(tenant);
  const pagesSnapshot = await tenantRef.collection("pages").get();
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  batch.update(tenantRef, {
    status: "published",
    updatedAt: now,
    publishedAt: now,
  });

  for (const page of pagesSnapshot.docs) {
    batch.update(page.ref, {
      status: "published",
      updatedAt: now,
      publishedAt: now,
    });
  }

  await batch.commit();
}

export async function saveTenantLogo({
  tenant,
  ownerUid,
  canAccessAllTenants = false,
  file,
}: {
  tenant: string;
  ownerUid: string;
  canAccessAllTenants?: boolean;
  file: File;
}) {
  const config = await getOwnerTenant(tenant, ownerUid, canAccessAllTenants);

  if (file.size > LOGO_MAX_BYTES) {
    throw new ValidationError("Logo acima do tamanho maximo permitido.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.byteLength > LOGO_MAX_BYTES) {
    throw new ValidationError("Logo acima do tamanho maximo permitido.");
  }

  const imageType = detectLogoImageType(bytes);

  if (!imageType) {
    throw new ValidationError("Envie uma imagem PNG, JPEG ou WebP.");
  }

  const bucket = getAdminStorage().bucket();
  const logoPath = `tenants/${tenant}/logo.${logoExtension(imageType)}`;

  await bucket.file(logoPath).save(bytes, {
    contentType: logoContentType(imageType),
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  // A new format writes to a new path, so the previous file would linger.
  if (config.logoPath && config.logoPath !== logoPath) {
    await bucket
      .file(config.logoPath)
      .delete()
      .catch(() => null);
  }

  await getAdminDb().collection("tenants").doc(tenant).update({
    logoPath,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return logoPath;
}

export async function createPrayerRequest({
  tenant,
  message,
}: {
  tenant: string;
  message: string;
}) {
  assertTenantSlug(tenant);

  const cleanMessage = message.trim();

  if (cleanMessage.length < PRAYER_REQUEST_MIN_LENGTH) {
    throw new ValidationError("Pedido de oração vazio.");
  }

  if (cleanMessage.length > PRAYER_REQUEST_MAX_LENGTH) {
    throw new ValidationError("Pedido de oração muito longo.");
  }

  // Firestore creates subcollections implicitly, so without this check a
  // request could be written under a tenant that does not exist.
  const config = await getTenantConfig(tenant);

  if (!config || config.status !== "published") {
    throw new TenantError("Minisite nao encontrado.", "not-found");
  }

  // Handed to the visitor so only they can attach contact details later.
  const contactToken = randomBytes(32).toString("base64url");

  const requestRef = await getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("prayerRequests")
    .add({
      message: cleanMessage,
      status: "new",
      wantsContact: false,
      contactTokenHash: hashContactToken(contactToken),
      contactTokenExpiresAt: Timestamp.fromMillis(
        Date.now() + CONTACT_TOKEN_TTL_MS
      ),
      createdAt: FieldValue.serverTimestamp(),
    });

  return { id: requestRef.id, contactToken };
}

export async function addPrayerRequestContact({
  tenant,
  requestId,
  token,
  name,
  whatsapp,
}: {
  tenant: string;
  requestId: string;
  token: string;
  name: string;
  whatsapp: string;
}) {
  assertTenantSlug(tenant);

  const cleanName = name.trim().slice(0, PRAYER_CONTACT_NAME_MAX_LENGTH);
  const cleanWhatsapp = whatsapp.trim();

  if (!requestId || !token || !cleanWhatsapp) {
    throw new ValidationError("Contato invalido.");
  }

  const requestRef = getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("prayerRequests")
    .doc(requestId);
  const snapshot = await requestRef.get();

  if (!snapshot.exists) {
    throw new TenantError("Pedido de oração não encontrado.", "not-found");
  }

  const data = snapshot.data() ?? {};

  if (data.wantsContact === true) {
    throw new ValidationError("Contato ja registrado para este pedido.");
  }

  const expiresAt = timestampToDate(data.contactTokenExpiresAt);

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    throw new ValidationError("Prazo para enviar o contato expirou.");
  }

  if (!matchesContactToken(token, data.contactTokenHash)) {
    throw new TenantError("Voce nao pode alterar este pedido.", "forbidden");
  }

  await requestRef.update({
    wantsContact: true,
    contactName: cleanName,
    contactWhatsapp: normalizePhoneDigits(cleanWhatsapp),
    contactUpdatedAt: FieldValue.serverTimestamp(),
    // Single use: burn the token so the contact cannot be overwritten.
    contactTokenHash: FieldValue.delete(),
    contactTokenExpiresAt: FieldValue.delete(),
  });
}
