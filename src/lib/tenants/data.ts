import "server-only";

import { unstable_cache } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { normalizePhoneDigits } from "@/lib/phone";
import { tenantPathTag, tenantTag } from "@/lib/tenants/cache-tags";
import { isValidTenantSlug } from "@/lib/tenants/paths";

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
  await getOwnerTenant(tenant, ownerUid, canAccessAllTenants);

  const bucket = getAdminStorage().bucket();
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const logoPath = `tenants/${tenant}/logo.${extension}`;

  await bucket.file(logoPath).save(bytes, {
    contentType: file.type || "application/octet-stream",
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

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

  if (cleanMessage.length < 3) {
    throw new Error("Pedido de oração vazio.");
  }

  const requestRef = await getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("prayerRequests")
    .add({
      message: cleanMessage,
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });

  return requestRef.id;
}

export async function addPrayerRequestContact({
  tenant,
  requestId,
  name,
  whatsapp,
}: {
  tenant: string;
  requestId: string;
  name: string;
  whatsapp: string;
}) {
  assertTenantSlug(tenant);

  const cleanName = name.trim();
  const cleanWhatsapp = whatsapp.trim();

  if (!requestId || (!cleanName && !cleanWhatsapp)) {
    throw new Error("Contato vazio.");
  }

  const requestRef = getAdminDb()
    .collection("tenants")
    .doc(tenant)
    .collection("prayerRequests")
    .doc(requestId);
  const snapshot = await requestRef.get();

  if (!snapshot.exists) {
    throw new Error("Pedido de oração não encontrado.");
  }

  await requestRef.update({
    wantsContact: true,
    contactName: cleanName,
    contactWhatsapp: normalizePhoneDigits(cleanWhatsapp),
    contactUpdatedAt: FieldValue.serverTimestamp(),
  });
}
