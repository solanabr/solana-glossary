import LearningPathView from "@/components/LearningPathView";
import { learningPaths } from "@/lib/learning-paths";

export function generateStaticParams() {
  return learningPaths.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = learningPaths.find((p) => p.slug === slug);
  return {
    title: path ? `${path.title} - Learning Path` : "Learning Path",
    description:
      path?.description ?? "Guided learning path for Solana concepts",
  };
}

export default async function LearningPathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <LearningPathView slug={slug} />;
}
