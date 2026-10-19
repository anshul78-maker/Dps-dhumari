/** Pick a PDF to upload, and open authenticated PDF documents from the API. */
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { fileUrl } from "@/api/client";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export interface PickedPdf {
  dataUrl: string; // data:application/pdf;base64,...
  name: string;
  size: number;
}

/** Let the user choose a PDF; returns it as a data URL ready for the API. */
export async function pickPdf(): Promise<PickedPdf | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const size = asset.size ?? 0;
  if (size > MAX_PDF_BYTES) {
    throw new Error("PDF must be under 5 MB.");
  }

  let base64: string;
  if (Platform.OS === "web") {
    // On web the uri is a blob/object URL — fetch and convert.
    const blob = await (await fetch(asset.uri)).blob();
    base64 = await blobToBase64(blob);
  } else {
    base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  return {
    dataUrl: `data:application/pdf;base64,${base64}`,
    name: asset.name || "document.pdf",
    size: size || base64.length,
  };
}

/**
 * Download an authenticated PDF (token in the header) and hand it to the OS
 * share / preview sheet. On web, open the fetched blob in a new tab.
 */
export async function openAuthedPdf(
  apiPath: string,
  token: string | null,
  filename = "document.pdf"
): Promise<void> {
  const url = fileUrl(apiPath);
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  if (Platform.OS === "web") {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Couldn't open this file.");
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    globalThis.open?.(objUrl, "_blank");
    return;
  }

  const safe = filename.replace(/[^\w.\- ]+/g, "_") || "document.pdf";
  const target = `${FileSystem.cacheDirectory}${Date.now()}-${safe}`;
  const dl = await FileSystem.downloadAsync(url, target, { headers });
  if (dl.status !== 200) throw new Error("Couldn't open this file.");

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dl.uri, {
      mimeType: "application/pdf",
      dialogTitle: filename,
      UTI: "com.adobe.pdf",
    });
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
