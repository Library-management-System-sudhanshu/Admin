import { LoadingState } from "../../components/feedback/LoadingState";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useGetSaaSPlansQuery, useUpdateSaaSPlanMutation } from "../../store/api";
import { Plus, Edit, Zap, Award, Check, Building2, Users, Layers, MessageSquare, PhoneCall, Sparkles } from "lucide-react";
import { useToast } from "../../components/ui/ToastContext";

// Helper to resolve card styles based on plan names & pricing
const getPlanTheme = (price: number, name: string = "", isPopular: boolean = false) => {
  const n = (name || "").toLowerCase();
  
  if (isPopular || n.includes("growth") || n.includes("pro") || price === 599) {
    return {
      primary: "#2563eb", // Indigo Blue
      bgLight: "rgba(37, 99, 235, 0.04)",
      bgBorder: "rgba(37, 99, 235, 0.25)",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      shadow: "rgba(37, 99, 235, 0.18)",
      badge: "Growth Tier",
      icon: <Award size={22} style={{ color: "#2563eb" }} />,
      popular: true,
      popularLabel: "⭐ Most Popular"
    };
  } else if (n.includes("business") || price === 899) {
    return {
      primary: "#d97706", // Amber / Warm Orange
      bgLight: "rgba(217, 119, 6, 0.04)",
      bgBorder: "rgba(217, 119, 6, 0.25)",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      shadow: "rgba(217, 119, 6, 0.16)",
      badge: "Business Tier",
      icon: <Building2 size={22} style={{ color: "#d97706" }} />,
      popular: false
    };
  } else if (n.includes("standard") || price === 449) {
    return {
      primary: "#0891b2", // Cyan / Teal
      bgLight: "rgba(8, 145, 178, 0.04)",
      bgBorder: "rgba(8, 145, 178, 0.22)",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      shadow: "rgba(8, 145, 178, 0.15)",
      badge: "Standard Tier",
      icon: <Zap size={22} style={{ color: "#0891b2" }} />,
      popular: false
    };
  } else if (n.includes("elite") || n.includes("enterprise") || price >= 1200) {
    return {
      primary: "#8b5cf6", // Violet / Purple
      bgLight: "rgba(139, 92, 246, 0.04)",
      bgBorder: "rgba(139, 92, 246, 0.25)",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      shadow: "rgba(139, 92, 246, 0.18)",
      badge: "Enterprise Elite",
      icon: <Sparkles size={22} style={{ color: "#8b5cf6" }} />,
      popular: false
    };
  } else {
    return {
      primary: "#10b981", // Emerald
      bgLight: "rgba(16, 185, 129, 0.04)",
      bgBorder: "rgba(16, 185, 129, 0.2)",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      shadow: "rgba(16, 185, 129, 0.12)",
      badge: "Starter Tier",
      icon: <Zap size={22} style={{ color: "#10b981" }} />,
      popular: false
    };
  }
};

export default function SaaSPlans() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: plans = [], isLoading } = useGetSaaSPlansQuery({});
  const [updatePlan] = useUpdateSaaSPlanMutation();

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const handleToggleActive = async (plan: any) => {
    try {
      await updatePlan({ id: plan.id, isActive: !plan.isActive }).unwrap();
      showToast(`Plan has been ${!plan.isActive ? "enabled" : "disabled"} successfully.`, "success");
    } catch (err) {
      showToast("Error updating plan status.", "error");
    }
  };

  if (isLoading) {
    return (
      <LoadingState label="Loading platform plans..." />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Header section with description and Billing Cycle Toggle */}
      <div style={{
        background: "#ffffff",
        border: "1px solid rgba(15, 23, 42, 0.06)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              SaaS Subscription Plans
            </h2>
            <span style={{ 
              background: "#f1f5f9", 
              color: "#475569", 
              padding: "3px 10px", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 700 
            }}>
              {plans.length} Tiers Configured
            </span>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
            Configure and manage SaaS subscription plans. All seat thresholds represent physical desks across the account.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Monthly / Annual Toggle Switch */}
          <div style={{
            display: "inline-flex",
            background: "#f1f5f9",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid #e2e8f0"
          }}>
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              style={{
                border: "none",
                background: billingCycle === "monthly" ? "#ffffff" : "transparent",
                color: billingCycle === "monthly" ? "#0f172a" : "#64748b",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.825rem",
                cursor: "pointer",
                boxShadow: billingCycle === "monthly" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s"
              }}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              style={{
                border: "none",
                background: billingCycle === "annual" ? "#ffffff" : "transparent",
                color: billingCycle === "annual" ? "#0f172a" : "#64748b",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.825rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: billingCycle === "annual" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s"
              }}
            >
              Annual (2 Months Free)
              <span style={{ 
                background: "#dcfce7", 
                color: "#166534", 
                fontSize: "0.7rem", 
                padding: "1px 6px", 
                borderRadius: "6px", 
                fontWeight: 800 
              }}>
                Save 17%
              </span>
            </button>
          </div>

          <Button 
            variant="primary" 
            onClick={() => navigate("/super-admin/plans/new")}
            style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "12px", padding: "10px 20px", fontWeight: 700 }}
          >
            <Plus size={16} /> Create New Plan
          </Button>
        </div>
      </div>

      {/* Grid of Plans */}
      {plans.length === 0 ? (
        <div style={{
          padding: "48px",
          textAlign: "center",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px dashed #cbd5e1",
          color: "#64748b"
        }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>No subscription tiers defined yet. Click \"Create New Plan\" to populate.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "24px",
          alignItems: "stretch"
        }}>
          {plans.map((plan: any) => {
            const theme = getPlanTheme(Number(plan.price), plan.name, plan.isPopular);
            const isHovered = hoveredCardId === plan.id;
            const isActive = plan.isActive;
            const isAnnual = billingCycle === "annual";
            const displayPrice = isAnnual 
              ? (plan.annualPrice ? Number(plan.annualPrice).toLocaleString("en-IN") : (Number(plan.price) * 10).toLocaleString("en-IN"))
              : Number(plan.price).toLocaleString("en-IN");
            const periodText = isAnnual ? "/ year (2 mo free)" : "/ month";

            return (
              <div 
                key={plan.id}
                onMouseEnter={() => setHoveredCardId(plan.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{
                  background: "#ffffff",
                  border: `2px solid ${isHovered ? theme.primary : isActive ? theme.bgBorder : "rgba(226, 232, 240, 0.8)"}`,
                  borderRadius: "20px",
                  padding: "28px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  opacity: isActive ? 1 : 0.65,
                  boxShadow: isHovered 
                    ? `0 20px 25px -5px ${theme.shadow}, 0 10px 10px -5px ${theme.shadow}` 
                    : "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
                  transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  overflow: "hidden"
                }}
              >
                {/* Popularity or Highlight Ribbon Badge */}
                {theme.popular && isActive && (
                  <div style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    background: theme.gradient,
                    color: "#ffffff",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    padding: "6px 14px",
                    borderBottomLeftRadius: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    {theme.popularLabel || "Most Popular"}
                  </div>
                )}

                {/* Card Title Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: theme.bgLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {theme.icon}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: theme.primary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {theme.badge}
                    </span>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                      {plan.name}
                    </h3>
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                  <span style={{ fontSize: "2.25rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>
                    ₹{displayPrice}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                    {periodText}
                  </span>
                </div>

                {/* Short Pitch Subtitle */}
                <p style={{ margin: 0, color: "#475569", fontSize: "0.85rem", lineHeight: 1.5, minHeight: "38px" }}>
                  {plan.description || "Everything you need to manage your study hall."}
                </p>

                {/* Plan Metrics / Key Threshold Allowances */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Allowance Quotas
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      🪑 {plan.maxSeats === -1 ? "Unlimited Seats" : `${plan.maxSeats} physical seats`}
                    </span>
                    <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      🚪 {plan.maxRooms === -1 ? "Unlimited Rooms" : `${plan.maxRooms} rooms/floors`}
                    </span>
                    <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      🏢 {plan.maxBranches === -1 ? "Unlimited Branches" : `${plan.maxBranches || 1} branch${(plan.maxBranches || 1) > 1 ? "es" : ""}`}
                    </span>
                    <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      👥 {plan.maxStaff === -1 ? "Unlimited Staff" : `${plan.maxStaff || 1} staff account${(plan.maxStaff || 1) > 1 ? "s" : ""}`}
                    </span>
                    <span style={{ 
                      background: plan.allowWhatsApp ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.06)", 
                      color: plan.allowWhatsApp ? "#059669" : "#dc2626", 
                      border: `1px solid ${plan.allowWhatsApp ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.15)"}`,
                      padding: "4px 8px", 
                      borderRadius: "8px", 
                      fontSize: "0.75rem", 
                      fontWeight: 700 
                    }}>
                      💬 WhatsApp: {plan.allowWhatsApp ? "Enabled (credits separate)" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Included Features
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feat: string, index: number) => (
                        <li key={index} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem", color: "#334155", lineHeight: 1.4 }}>
                          <Check size={15} style={{ color: theme.primary, flexShrink: 0, marginTop: "2px" }} />
                          <span>{feat}</span>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>No features specified</li>
                    )}
                  </ul>
                </div>

                {/* Actions row */}
                <div style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => navigate(`/super-admin/plans/edit/${plan.id}`)}
                    style={{ borderRadius: "10px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <Edit size={14} /> Edit Tier
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleToggleActive(plan)}
                    style={{ 
                      borderRadius: "10px", 
                      fontWeight: 700,
                      borderColor: isActive ? "#dc2626" : "#16a34a", 
                      color: isActive ? "#dc2626" : "#16a34a",
                      minWidth: "90px"
                    }}
                  >
                    {isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tier 6: Custom Enterprise Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#ffffff",
        borderRadius: "20px",
        padding: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "24px",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tier 6: Enterprise
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Custom Quotation</span>
          </div>
          <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
            Need More than 500 Seats or 5 Branches?
          </h3>
          <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>
            For high-volume library chains requiring over 500 physical desks, dedicated mobile apps, custom website branding, large data migrations, or contracted 24/7 SLA arrangements.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
            <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem" }}>✓ 500+ Physical Desks</span>
            <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem" }}>✓ Unlimited Branches</span>
            <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem" }}>✓ Dedicated Branded Apps</span>
            <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem" }}>✓ Custom Integrations & Migrations</span>
          </div>
        </div>

        <div>
          <a
            href="mailto:support@studyflow.com?subject=Custom%20Enterprise%20Plan%20Inquiry"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#38bdf8",
              color: "#0f172a",
              fontWeight: 800,
              fontSize: "0.9rem",
              padding: "14px 28px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(56, 189, 248, 0.3)"
            }}
          >
            <PhoneCall size={16} /> Contact Sales for Quotation
          </a>
        </div>
      </div>

    </div>
  );
}
