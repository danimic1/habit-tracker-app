type HabitGridProps = {
  completedDates: Set<string>;
};

const TOTAL_WEEKS = 26;
const DAYS_IN_WEEK = 7;

function getGridDates(): string[] {
  const today = new Date();
  // Find the most recent Sunday (start of the current week column)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() + (6 - dayOfWeek)); // advance to Saturday

  const dates: string[] = [];
  for (let i = TOTAL_WEEKS * DAYS_IN_WEEK - 1; i >= 0; i--) {
    const d = new Date(endOfGrid);
    d.setDate(endOfGrid.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitGrid({ completedDates }: HabitGridProps) {
  const dates = getGridDates();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ opacity: 0.4, marginTop: 14, width: "100%" }}>
    <div style={{ overflowX: "auto", padding: "6px 2px 2px 2px", width: "100%" }}>
      <div style={{ display: "flex", gap: 4, width: "100%" }}>
        {/* Day labels */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${DAYS_IN_WEEK}, auto)`,
            gap: 3,
            alignItems: "center",
            marginRight: 2,
          }}
        >
          {DAY_LABELS.map((label) => (
            <span
              key={label}
              style={{ fontSize: 8, color: "#9ca3af", lineHeight: "10px", width: 20 }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${DAYS_IN_WEEK}, auto)`,
            gridTemplateColumns: `repeat(${TOTAL_WEEKS}, 1fr)`,
            gridAutoFlow: "column",
            gap: 3,
            flex: 1,
            minWidth: 0,
          }}
        >
          {dates.map((date) => {
            const completed = completedDates.has(date);
            const isToday = date === today;
            return (
              <div
                key={date}
                title={date}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: 2,
                  backgroundColor: completed ? "#22c55e" : "#e5e7eb",
                  outline: isToday ? "1.5px solid #16a34a" : undefined,
                  outlineOffset: "1px",
                  opacity: date > today ? 0.3 : 1,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}
