import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

const DATA_FOLDER = path.resolve("data");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] | undefined }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params || [];
    const filePath = slug ? path.join(DATA_FOLDER, ...slug) : null;
    if (!filePath) throw new Error()

    const content = await fs.readFile(filePath, "utf-8");
    if (!content) throw new Error()

    return new NextResponse(content, { status: 200, headers: { "Content-Type": "text/calendar" } });
  } catch (ex) {
    console.log(ex);
    return new NextResponse("File not found", { status: 404 });
  }
}
