import { notFound } from "next/navigation";
import { MemberPageClient } from "@/components/MemberPageClient";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const num = Number(id);

  if (![1, 2, 3, 4].includes(num)) {
    notFound();
  }

  return <MemberPageClient memberNumber={num as 1 | 2 | 3 | 4} />;
}
