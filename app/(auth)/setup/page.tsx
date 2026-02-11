"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import {
  Check,
  ChevronRight,
  SkipForward,
  UtensilsCrossed,
  Grid3X3,
  Receipt,
  Users,
  Plus,
  X,
  Loader2,
} from "lucide-react";

const STEPS = [
  { id: "categories", label: "Menu Categories", icon: UtensilsCrossed },
  { id: "tables", label: "Tables", icon: Grid3X3 },
  { id: "tax", label: "Tax Rates", icon: Receipt },
  { id: "staff", label: "Staff Members", icon: Users },
];

const DEFAULT_CATEGORIES = [
  { name: "Starters", icon: "🥗" },
  { name: "Main Course", icon: "🍛" },
  { name: "Beverages", icon: "🥤" },
  { name: "Desserts", icon: "🍰" },
  { name: "Snacks", icon: "🍟" },
  { name: "Breads", icon: "🫓" },
  { name: "Rice & Biryani", icon: "🍚" },
  { name: "Soups", icon: "🍲" },
];

export default function SetupWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Categories
  const [selectedCategories, setSelectedCategories] = useState<{ name: string; icon: string }[]>(
    DEFAULT_CATEGORIES.slice(0, 4)
  );
  const [newCategoryName, setNewCategoryName] = useState("");

  // Step 2: Tables
  const [tableCount, setTableCount] = useState(10);

  // Step 3: Tax
  const [cgst, setCgst] = useState("2.5");
  const [sgst, setSgst] = useState("2.5");
  const [serviceCharge, setServiceCharge] = useState("");

  // Step 4: Staff
  const [staffMembers, setStaffMembers] = useState<
    { name: string; mobile: string; passcode: string; role: string }[]
  >([]);
  const [staffName, setStaffName] = useState("");
  const [staffMobile, setStaffMobile] = useState("");
  const [staffPasscode, setStaffPasscode] = useState("");
  const [staffRole, setStaffRole] = useState("waiter");

  const toggleCategory = (cat: { name: string; icon: string }) => {
    setSelectedCategories((prev) =>
      prev.some((c) => c.name === cat.name)
        ? prev.filter((c) => c.name !== cat.name)
        : [...prev, cat]
    );
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    setSelectedCategories((prev) => [...prev, { name: newCategoryName.trim(), icon: "🍽️" }]);
    setNewCategoryName("");
  };

  const addStaffMember = () => {
    if (!staffName || !staffMobile || !staffPasscode) return;
    setStaffMembers((prev) => [
      ...prev,
      { name: staffName, mobile: staffMobile, passcode: staffPasscode, role: staffRole },
    ]);
    setStaffName("");
    setStaffMobile("");
    setStaffPasscode("");
    setStaffRole("waiter");
  };

  const removeStaff = (index: number) => {
    setStaffMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const saveCategories = async () => {
    if (!restaurantId || selectedCategories.length === 0) return;
    setSaving(true);
    try {
      for (let i = 0; i < selectedCategories.length; i++) {
        await fetch("/api/menu/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            name: selectedCategories[i].name,
            icon: selectedCategories[i].icon,
            sortingOrder: i + 1,
          }),
        });
      }
      markComplete();
    } catch {
      // Continue anyway
    }
    setSaving(false);
  };

  const saveTables = async () => {
    if (!restaurantId || tableCount <= 0) return;
    setSaving(true);
    try {
      // Delete default tables from registration before creating new ones
      await fetch(`/api/tables?restaurantId=${restaurantId}`, { method: "DELETE" });
      for (let i = 1; i <= tableCount; i++) {
        await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            tableNumber: i,
            capacity: 4,
            status: "available",
          }),
        });
      }
      markComplete();
    } catch {
      // Continue anyway
    }
    setSaving(false);
  };

  const saveTaxSettings = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`);
      const current = await res.json();
      const existingSettings =
        typeof current?.settings === "object" && current.settings !== null
          ? current.settings
          : {};

      await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...existingSettings,
            tax: {
              cgst: parseFloat(cgst) || 0,
              sgst: parseFloat(sgst) || 0,
              serviceCharge: parseFloat(serviceCharge) || 0,
            },
            taxRate: (parseFloat(cgst) || 0) + (parseFloat(sgst) || 0),
            serviceCharge: parseFloat(serviceCharge) || 0,
            setupComplete: true,
          },
        }),
      });
      markComplete();
    } catch {
      // Continue anyway
    }
    setSaving(false);
  };

  const saveStaff = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      for (const member of staffMembers) {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            name: member.name,
            mobile: member.mobile,
            passcode: member.passcode,
            role: member.role,
          }),
        });
      }
    } catch {
      // Continue anyway
    }
    setSaving(false);
    finish();
  };

  const markComplete = () => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    setCurrentStep((prev) => prev + 1);
  };

  const skip = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const finish = async () => {
    // Setup data was already saved to individual DB tables (categories, tables, tax, staff)
    // Just redirect — React Query will fetch fresh data from the API
    router.push("/home");
    router.refresh();
  };

  // Need a GET on restaurant endpoint for fetching settings
  // Let's add it inline for the tax step
  const handleSaveStep = async () => {
    switch (currentStep) {
      case 0:
        await saveCategories();
        break;
      case 1:
        await saveTables();
        break;
      case 2:
        await saveTaxSettings();
        break;
      case 3:
        await saveStaff();
        break;
    }
  };

  const isLastStep = currentStep >= STEPS.length;

  if (isLastStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">You&apos;re all set!</h2>
          <p className="text-muted-foreground">
            Your restaurant is ready. You can always update these settings later.
          </p>
          <Button onClick={finish} className="w-full h-12">
            Go to Dashboard
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" collapsed />
            <span className="font-semibold text-lg">Setup</span>
          </div>
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip all
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex-1 flex items-center gap-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < currentStep
                    ? "bg-primary"
                    : i === currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="p-6">
          {/* Step 1: Categories */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  Menu Categories
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Select categories for your menu. You can always add more later.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.some((c) => c.name === cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Custom categories */}
              {selectedCategories
                .filter((c) => !DEFAULT_CATEGORIES.some((d) => d.name === c.name))
                .map((cat) => (
                  <Badge key={cat.name} variant="secondary" className="mr-2">
                    {cat.name}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom category..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addCustomCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Tables */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-primary" />
                  Configure Tables
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  How many tables does your restaurant have? Tables will be numbered automatically.
                </p>
              </div>

              <div className="flex items-center gap-4 justify-center py-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                >
                  -
                </Button>
                <div className="text-center">
                  <Input
                    type="number"
                    value={tableCount}
                    onChange={(e) =>
                      setTableCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
                    }
                    className="text-center text-3xl font-bold w-24 h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-sm text-muted-foreground mt-1">tables</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setTableCount(Math.min(100, tableCount + 1))}
                >
                  +
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tables will be created as Table 01, Table 02, ... Table{" "}
                {String(tableCount).padStart(2, "0")}
              </p>
            </div>
          )}

          {/* Step 3: Tax Rates */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Tax Configuration
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Set your GST rates. These apply to all orders by default.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">CGST %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={cgst}
                    onChange={(e) => setCgst(e.target.value)}
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">SGST %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={sgst}
                    onChange={(e) => setSgst(e.target.value)}
                    placeholder="2.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Service Charge % <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium">Preview on a ₹1000 order:</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹1,000</span>
                  </div>
                  {parseFloat(cgst) > 0 && (
                    <div className="flex justify-between">
                      <span>CGST ({cgst}%)</span>
                      <span>₹{((1000 * parseFloat(cgst)) / 100).toFixed(0)}</span>
                    </div>
                  )}
                  {parseFloat(sgst) > 0 && (
                    <div className="flex justify-between">
                      <span>SGST ({sgst}%)</span>
                      <span>₹{((1000 * parseFloat(sgst)) / 100).toFixed(0)}</span>
                    </div>
                  )}
                  {parseFloat(serviceCharge) > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge ({serviceCharge}%)</span>
                      <span>₹{((1000 * parseFloat(serviceCharge)) / 100).toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-foreground border-t pt-1 mt-1">
                    <span>Total</span>
                    <span>
                      ₹
                      {(
                        1000 +
                        (1000 * (parseFloat(cgst) || 0)) / 100 +
                        (1000 * (parseFloat(sgst) || 0)) / 100 +
                        (1000 * (parseFloat(serviceCharge) || 0)) / 100
                      ).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Staff */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Add Staff Members
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Add your waiters, kitchen staff, and managers. They can log in with their mobile &
                  passcode.
                </p>
              </div>

              {staffMembers.length > 0 && (
                <div className="space-y-2">
                  {staffMembers.map((member, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.mobile} &middot; {member.role}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeStaff(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Name"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                  <Input
                    placeholder="Mobile number"
                    value={staffMobile}
                    onChange={(e) => setStaffMobile(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="password"
                    placeholder="Passcode"
                    value={staffPasscode}
                    onChange={(e) => setStaffPasscode(e.target.value)}
                  />
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addStaffMember}
                  disabled={!staffName || !staffMobile || !staffPasscode}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" onClick={skip} disabled={saving}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <Button onClick={handleSaveStep} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 3 ? (
                <>
                  {staffMembers.length > 0 ? "Save & Finish" : "Finish"}
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Save & Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
