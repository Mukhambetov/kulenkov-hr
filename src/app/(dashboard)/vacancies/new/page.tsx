import { PageHeader } from "@/components/page-header";
import { VacancyGenerator } from "./vacancy-generator";

export default function NewVacancyPage() {
  return (
    <div>
      <PageHeader
        title="Создать вакансию"
        description="Заполните параметры — AI сгенерирует описание"
      />
      <div className="p-8">
        <VacancyGenerator />
      </div>
    </div>
  );
}
