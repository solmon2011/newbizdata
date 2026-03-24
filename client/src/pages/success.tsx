import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-10 text-center border border-gray-200 bg-white rounded-2xl shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment successful!</h1>
        <p className="text-gray-500 mb-8">
          Your subscription is now active. You can start exploring new business entity data right away.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-11 font-semibold"
          >
            <a href="/#/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
