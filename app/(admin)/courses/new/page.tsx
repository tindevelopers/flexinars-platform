import CourseForm from "../CourseForm";
import { createCourse } from "../actions";

export const dynamic = "force-dynamic";

export default function NewCoursePage() {
  return (
    <CourseForm
      action={createCourse}
      submitLabel="Create Course"
      heading="Create Course"
    />
  );
}
