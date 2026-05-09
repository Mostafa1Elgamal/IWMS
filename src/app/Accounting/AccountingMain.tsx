import { useState } from "react";
import { AccountingSidebar } from "./AccountingSidebar";
import { FinancialDashboard } from "./FinancialDashboard";
import { JobCosting } from "./JobCosting";
import { InvoicesScreen } from "./InvoicesScreen";
import { PaymentsScreen } from "./PaymentsScreen";
import { FinancialReports } from "./FinancialReports";
import { ActivityLogsScreen } from "./ActivityLogsScreen";

type Screen = "dashboard" | "costing" | "invoices" | "payments" | "reports" | "activity-logs";

export default function AccountingMain() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AccountingSidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {currentScreen === "dashboard" && <FinancialDashboard />}
      {currentScreen === "costing" && <JobCosting onGenerateInvoice={() => setCurrentScreen("invoices")} />}
      {currentScreen === "invoices" && <InvoicesScreen />}
      {currentScreen === "payments" && <PaymentsScreen />}
      {currentScreen === "reports" && <FinancialReports />}
      {currentScreen === "activity-logs" && <ActivityLogsScreen />}
    </div>
  );
}
