import { notFound } from "next/navigation";
import CourseForm from "../../CourseForm";
import { updateCourse } from "../../actions";
import { getCourseById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  // Bind the course id so the form action matches (prev, formData).
  const action = updateCourse.bind(null, id);

  return (
    <CourseForm
      action={action}
      course={course}
      submitLabel="Save Changes"
      heading="Edit Course"
    />
  );
}
