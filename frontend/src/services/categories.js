export const CATEGORY_META = {
  software_engineering: { emoji: "⚙️", color: "#67c6ff", label: "Software Engineering" },
  data_science:         { emoji: "📊", color: "#c8ff00", label: "Data Science" },
  product_management:   { emoji: "🗺️", color: "#ff6b6b", label: "Product Management" },
  design:               { emoji: "🎨", color: "#ff9ff3", label: "Design" },
  marketing:            { emoji: "📣", color: "#ffb347", label: "Marketing" },
  sales:                { emoji: "💼", color: "#00e5a0", label: "Sales" },
  finance:              { emoji: "💰", color: "#ffd700", label: "Finance" },
  operations:           { emoji: "🔧", color: "#a29bfe", label: "Operations" },
  customer_support:     { emoji: "🎧", color: "#fd79a8", label: "Customer Support" },
  human_resources:      { emoji: "👥", color: "#55efc4", label: "Human Resources" },
  legal:                { emoji: "⚖️", color: "#dfe6e9", label: "Legal" },
  healthcare:           { emoji: "🏥", color: "#74b9ff", label: "Healthcare" },
};

export const getCategoryMeta = (cat) =>
  CATEGORY_META[cat] ?? { emoji: "❓", color: "#888", label: cat };

export const formatPercent = (v) => `${(v * 100).toFixed(1)}%`;
export const formatMs = (v) => `${v?.toFixed(1) ?? "—"}ms`;
