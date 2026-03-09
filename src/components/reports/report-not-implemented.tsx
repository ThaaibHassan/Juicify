import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { title?: string; message?: string };

export function ReportNotImplemented({
  title = "Report not available",
  message = "This report requires data sources or features that are not yet configured (e.g. outlets, batches, loyalty, expenses).",
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
