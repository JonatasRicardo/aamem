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
  const [status, setStatus] = useState<SubmitStatus>(
    isPublished ? "success" : "idle"
  );
  const localLogoUrlRef = useRef<string | null>(null);

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
      await saveDraft({
        institutionName: institutionNameValue,
        description: descriptionValue,
      });
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  function handleThemeChange(nextTheme: MinisiteTheme) {
    setTheme(nextTheme);
    void saveDraft({ themeId: nextTheme }).catch(() => setStatus("error"));
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
        router.refresh();
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <CreateInstitutionTemplate
      institutionName={institutionNameValue}
      personName={personName}
      email={email}
      slug={slug}
      description={descriptionValue}
      logoPreviewUrl={logoPreviewUrl}
      theme={theme}
      submitStatus={status}
      submitLabel={isPublished ? "minisite publicado" : "publicar minisite"}
      editableField={editingField}
      onEditableFieldChange={setEditingField}
      onInstitutionNameChange={setInstitutionNameValue}
      onDescriptionChange={setDescriptionValue}
      onFieldEditEnd={handleFieldEditEnd}
      onLogoChange={handleLogoChange}
      onThemeChange={handleThemeChange}
      onSubmit={isPublished ? undefined : handlePublish}
    />
  );
}
