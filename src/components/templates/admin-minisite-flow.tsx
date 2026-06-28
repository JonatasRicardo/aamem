"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CreateInstitutionTemplate,
  type EditableMinisiteField,
  type MinisiteTheme,
  type SubmitStatus,
} from "@/components/templates/create-your-own-flow";

type AdminMinisiteFlowProps = {
  className?: string;
  embedded?: boolean;
  quickEdit?: boolean;
  submitActionContainerClassName?: string;
  institutionName: string;
  personName: string;
  email: string;
  slug: string;
  description: string;
  logoPreviewUrl?: string;
  theme: MinisiteTheme;
  isPublished: boolean;
};

export function AdminMinisiteFlow({
  className,
  embedded = false,
  quickEdit = false,
  submitActionContainerClassName,
  institutionName,
  personName,
  email,
  slug,
  description,
  logoPreviewUrl: initialLogoPreviewUrl,
  theme: initialTheme,
  isPublished,
}: AdminMinisiteFlowProps) {
  const router = useRouter();
  const [institutionNameValue, setInstitutionNameValue] =
    useState(institutionName);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(initialLogoPreviewUrl);
  const [editingField, setEditingField] =
    useState<EditableMinisiteField | null>(null);
  const [theme, setTheme] = useState(initialTheme);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [hasPendingPublish, setHasPendingPublish] = useState(false);
  const localLogoUrlRef = useRef<string | null>(null);
  const publishedSnapshotRef = useRef({
    institutionName,
    description,
    theme: initialTheme,
  });

  useEffect(() => {
    return () => {
      if (localLogoUrlRef.current) {
        URL.revokeObjectURL(localLogoUrlRef.current);
      }
    };
  }, []);

  async function saveDraft(patch: {
    institutionName?: string;
    description?: string;
    themeId?: MinisiteTheme;
  }) {
    const response = await fetch(`/api/minisites/${slug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel salvar o rascunho.");
    }
  }

  async function handleFieldEditEnd() {
    setEditingField(null);

    try {
      const hasPublishedTextChanges =
        institutionNameValue !== publishedSnapshotRef.current.institutionName ||
        descriptionValue !== publishedSnapshotRef.current.description;

      await saveDraft({
        institutionName: institutionNameValue,
        description: descriptionValue,
      });

      if (isPublished && hasPublishedTextChanges) {
        setHasPendingPublish(true);
      }

      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  function handleThemeChange(nextTheme: MinisiteTheme) {
    if (nextTheme === theme) {
      return;
    }

    setTheme(nextTheme);
    void saveDraft({ themeId: nextTheme })
      .then(() => {
        if (isPublished && nextTheme !== publishedSnapshotRef.current.theme) {
          setHasPendingPublish(true);
        }
      })
      .catch(() => setStatus("error"));
  }

  async function handleLogoChange(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      return;
    }

    const localUrl = URL.createObjectURL(file);

    if (localLogoUrlRef.current) {
      URL.revokeObjectURL(localLogoUrlRef.current);
    }

    localLogoUrlRef.current = localUrl;
    setLogoPreviewUrl(localUrl);

    const formData = new FormData();
    formData.set("logo", file);

    try {
      const response = await fetch(`/api/minisites/${slug}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar a logo.");
      }

      if (isPublished) {
        setHasPendingPublish(true);
      }

      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  async function handlePublish() {
    setStatus("loading");

    try {
      await saveDraft({
        institutionName: institutionNameValue,
        description: descriptionValue,
        themeId: theme,
      });

      const response = await fetch(`/api/minisites/${slug}/publish`, {
        method: "POST",
      });

      setStatus(response.ok ? "success" : "error");

      if (response.ok) {
        publishedSnapshotRef.current = {
          institutionName: institutionNameValue,
          description: descriptionValue,
          theme,
        };
        setHasPendingPublish(false);
        router.refresh();
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <CreateInstitutionTemplate
      className={className}
      embedded={embedded}
      quickEdit={quickEdit}
      submitDisabled={isPublished && !hasPendingPublish}
      submitActionContainerClassName={submitActionContainerClassName}
      institutionName={institutionNameValue}
      personName={personName}
      email={email}
      slug={slug}
      description={descriptionValue}
      logoPreviewUrl={logoPreviewUrl}
      theme={theme}
      submitStatus={status}
      submitLabel={isPublished ? "publicar alterações" : "publicar minisite"}
      submitLoadingLabel="publicando"
      editableField={editingField}
      onEditableFieldChange={setEditingField}
      onInstitutionNameChange={setInstitutionNameValue}
      onDescriptionChange={setDescriptionValue}
      onFieldEditEnd={handleFieldEditEnd}
      onLogoChange={handleLogoChange}
      onThemeChange={handleThemeChange}
      onSubmit={handlePublish}
    />
  );
}
