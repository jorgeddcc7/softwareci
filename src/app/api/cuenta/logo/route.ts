import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    const companyName = formData.get("company_name") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Falta el archivo del logo." },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Usa PNG, JPG, SVG o WebP." },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El logo no puede pesar más de 2 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop() || "png";
    const nombreArchivo = `${user.id}/logo.${extension}`;

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(nombreArchivo, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo logo:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el logo." },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(nombreArchivo);

    // Guardar en profiles
    await supabase
      .from("profiles")
      .update({
        logo_url: publicUrl,
        company_name: companyName?.trim() || null,
      })
      .eq("id", user.id);

    return NextResponse.json({ exito: true, logo_url: publicUrl });
  } catch (error) {
    console.error("Error en /api/cuenta/logo:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error: ${mensaje}` },
      { status: 500 }
    );
  }
}   