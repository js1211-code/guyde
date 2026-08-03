import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";

const BUCKET = "post-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * F-22 사진 업로드.
 *
 * 클라이언트가 Storage에 직접 붙지 않고 여기를 경유한다 —
 * 키를 노출하지 않고 확장자·크기·타입을 서버에서 한 번 거르기 위해서다.
 * 원본만 올리고 편집·필터는 만들지 않는다.
 *
 * 파일은 device_id 폴더 아래에 둔다. 나중에 "내 사진만 지우기"를 할 때
 * 경로만 보고 주인을 알 수 있다.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("INVALID_FORM", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("FILE_REQUIRED", 400);
  if (file.size > MAX_BYTES) {
    return fail("FILE_TOO_LARGE", 413, "5MB까지 올릴 수 있어요");
  }
  if (!ALLOWED.includes(file.type)) {
    return fail("UNSUPPORTED_TYPE", 415, "이미지 파일만 올릴 수 있어요");
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;

  const db = createAdminClient();
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return fail("UPLOAD_FAILED", 500, error.message);

  const {
    data: { publicUrl },
  } = db.storage.from(BUCKET).getPublicUrl(path);

  return ok({ url: publicUrl, path }, 201);
}
