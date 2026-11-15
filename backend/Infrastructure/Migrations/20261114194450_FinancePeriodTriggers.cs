using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <summary>
    /// Recreates the four finance read-model triggers from schema v4:
    /// <c>trg_income_aiud</c>, <c>trg_expense_aiud</c>, <c>trg_cashflow_aiud</c> and
    /// <c>trg_order_aiud</c>. Each affected month is recomputed from the source tables
    /// (Asia/Ho_Chi_Minh months), and closed periods are left untouched.
    /// </summary>
    public partial class FinancePeriodTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION refresh_finance_period(p_period text)
                RETURNS void
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    v_start timestamptz;
                    v_end timestamptz;
                    v_total_orders integer;
                    v_total_revenue bigint;
                    v_total_expense bigint;
                    v_total_supplier_expense bigint;
                    v_cash_inflow bigint;
                    v_cash_outflow bigint;
                    v_receivables bigint;
                    v_payables bigint;
                BEGIN
                    IF p_period IS NULL OR p_period !~ '^[0-9]{4}-[0-9]{2}$' THEN
                        RETURN;
                    END IF;

                    v_start := ((p_period || '-01')::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh');
                    v_end := v_start + interval '1 month';

                    SELECT count(*)::integer
                      INTO v_total_orders
                      FROM orders o
                     WHERE o."CreatedOnUtc" >= v_start
                       AND o."CreatedOnUtc" < v_end;

                    SELECT coalesce(sum(i."Amount"), 0)::bigint
                      INTO v_total_revenue
                      FROM incomes i
                     WHERE i."RecognizedAt" >= v_start
                       AND i."RecognizedAt" < v_end;

                    SELECT coalesce(sum(e."Amount"), 0)::bigint
                      INTO v_total_expense
                      FROM expenses e
                     WHERE e."Date" >= v_start
                       AND e."Date" < v_end;

                    -- ExpenseCategory.Supplier = 5
                    SELECT coalesce(sum(e."Amount"), 0)::bigint
                      INTO v_total_supplier_expense
                      FROM expenses e
                     WHERE e."Date" >= v_start
                       AND e."Date" < v_end
                       AND e."Category" = 5;

                    -- CashflowDirection.In = 0, Out = 1
                    SELECT coalesce(sum(c."Amount"), 0)::bigint
                      INTO v_cash_inflow
                      FROM cashflows c
                     WHERE c."Date" >= v_start
                       AND c."Date" < v_end
                       AND c."Direction" = 0;

                    SELECT coalesce(sum(c."Amount"), 0)::bigint
                      INTO v_cash_outflow
                      FROM cashflows c
                     WHERE c."Date" >= v_start
                       AND c."Date" < v_end
                       AND c."Direction" = 1;

                    -- Outstanding balance on orders that are neither completed (7) nor cancelled (8).
                    SELECT coalesce(sum(o."TotalAmount" - o."PaidAmount"), 0)::bigint
                      INTO v_receivables
                      FROM orders o
                     WHERE o."CreatedOnUtc" >= v_start
                       AND o."CreatedOnUtc" < v_end
                       AND o."Status" NOT IN (7, 8);

                    -- Unpaid supplier expenses due in this period.
                    SELECT coalesce(sum(e."Amount"), 0)::bigint
                      INTO v_payables
                      FROM expenses e
                     WHERE e."Date" >= v_start
                       AND e."Date" < v_end
                       AND e."SupplierId" IS NOT NULL
                       AND e."PaymentStatus" = 0;

                    INSERT INTO finance_periods (
                        "Period", "TotalOrders", "TotalRevenue", "TotalExpense", "TotalSupplierExpense",
                        "CashInflow", "CashOutflow", "TotalProfit", "CashOnHand", "Receivables", "Payables",
                        "IsClosed", "ClosedAt", "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy")
                    VALUES (
                        p_period, v_total_orders, v_total_revenue, v_total_expense, v_total_supplier_expense,
                        v_cash_inflow, v_cash_outflow,
                        v_total_revenue - v_total_expense,
                        v_cash_inflow - v_cash_outflow,
                        v_receivables, v_payables,
                        false, NULL, now(), NULL, now(), NULL)
                    ON CONFLICT ("Period") DO UPDATE SET
                        "TotalOrders" = EXCLUDED."TotalOrders",
                        "TotalRevenue" = EXCLUDED."TotalRevenue",
                        "TotalExpense" = EXCLUDED."TotalExpense",
                        "TotalSupplierExpense" = EXCLUDED."TotalSupplierExpense",
                        "CashInflow" = EXCLUDED."CashInflow",
                        "CashOutflow" = EXCLUDED."CashOutflow",
                        "TotalProfit" = EXCLUDED."TotalProfit",
                        "CashOnHand" = EXCLUDED."CashOnHand",
                        "Receivables" = EXCLUDED."Receivables",
                        "Payables" = EXCLUDED."Payables",
                        "LastModifiedOnUtc" = now()
                    WHERE finance_periods."IsClosed" = false;
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION finance_period_from_income()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    IF TG_OP IN ('UPDATE', 'DELETE') THEN
                        PERFORM refresh_finance_period(
                            to_char(OLD."RecognizedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    IF TG_OP IN ('INSERT', 'UPDATE') THEN
                        PERFORM refresh_finance_period(
                            to_char(NEW."RecognizedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    RETURN NULL;
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION finance_period_from_expense()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    IF TG_OP IN ('UPDATE', 'DELETE') THEN
                        PERFORM refresh_finance_period(
                            to_char(OLD."Date" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    IF TG_OP IN ('INSERT', 'UPDATE') THEN
                        PERFORM refresh_finance_period(
                            to_char(NEW."Date" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    RETURN NULL;
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION finance_period_from_cashflow()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    IF TG_OP IN ('UPDATE', 'DELETE') THEN
                        PERFORM refresh_finance_period(
                            to_char(OLD."Date" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    IF TG_OP IN ('INSERT', 'UPDATE') THEN
                        PERFORM refresh_finance_period(
                            to_char(NEW."Date" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    RETURN NULL;
                END;
                $$;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION finance_period_from_order()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    IF TG_OP IN ('UPDATE', 'DELETE') THEN
                        PERFORM refresh_finance_period(
                            to_char(OLD."CreatedOnUtc" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    IF TG_OP IN ('INSERT', 'UPDATE') THEN
                        PERFORM refresh_finance_period(
                            to_char(NEW."CreatedOnUtc" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'));
                    END IF;
                    RETURN NULL;
                END;
                $$;
                """);

            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_income_aiud ON incomes;");
            migrationBuilder.Sql("""
                CREATE TRIGGER trg_income_aiud
                AFTER INSERT OR UPDATE OR DELETE ON incomes
                FOR EACH ROW EXECUTE FUNCTION finance_period_from_income();
                """);

            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_expense_aiud ON expenses;");
            migrationBuilder.Sql("""
                CREATE TRIGGER trg_expense_aiud
                AFTER INSERT OR UPDATE OR DELETE ON expenses
                FOR EACH ROW EXECUTE FUNCTION finance_period_from_expense();
                """);

            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_cashflow_aiud ON cashflows;");
            migrationBuilder.Sql("""
                CREATE TRIGGER trg_cashflow_aiud
                AFTER INSERT OR UPDATE OR DELETE ON cashflows
                FOR EACH ROW EXECUTE FUNCTION finance_period_from_cashflow();
                """);

            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_order_aiud ON orders;");
            migrationBuilder.Sql("""
                CREATE TRIGGER trg_order_aiud
                AFTER INSERT OR UPDATE OR DELETE ON orders
                FOR EACH ROW EXECUTE FUNCTION finance_period_from_order();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_order_aiud ON orders;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_cashflow_aiud ON cashflows;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_expense_aiud ON expenses;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_income_aiud ON incomes;");

            migrationBuilder.Sql("DROP FUNCTION IF EXISTS finance_period_from_order();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS finance_period_from_cashflow();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS finance_period_from_expense();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS finance_period_from_income();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS refresh_finance_period(text);");
        }
    }
}
