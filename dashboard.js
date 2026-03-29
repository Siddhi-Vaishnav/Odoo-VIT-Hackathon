%%writefile app.py

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import date

# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="Reimbursement Dashboard",
    page_icon="🧾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------- CUSTOM CSS ----------------
st.markdown("""
<style>
    .main .block-container {
        padding-top: 1.2rem;
        padding-bottom: 2rem;
    }

    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #111827 0%, #0b1020 100%);
        border-right: 1px solid rgba(255,255,255,0.08);
    }

    .metric-card {
        background: linear-gradient(145deg, #111827, #0f172a);
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        margin-bottom: 10px;
    }

    .metric-title {
        color: #94a3b8;
        font-size: 14px;
        margin-bottom: 8px;
    }

    .metric-value {
        color: white;
        font-size: 28px;
        font-weight: 700;
    }

    .metric-delta {
        font-size: 13px;
        margin-top: 6px;
        color: #22c55e;
    }

    .section-card {
        background: linear-gradient(145deg, #111827, #0f172a);
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        margin-top: 8px;
        margin-bottom: 16px;
    }

    .quick-btn {
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        color: white;
        padding: 10px 14px;
        border-radius: 12px;
        text-align: center;
        font-weight: 600;
        border: 1px solid rgba(255,255,255,0.08);
        margin-bottom: 8px;
    }

    .alert-box {
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.35);
        border-radius: 14px;
        padding: 12px;
        margin-bottom: 10px;
    }

    .success-box {
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.35);
        border-radius: 14px;
        padding: 12px;
        margin-bottom: 10px;
    }

    .danger-box {
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.35);
        border-radius: 14px;
        padding: 12px;
        margin-bottom: 10px;
    }

    .small-note {
        color: #94a3b8;
        font-size: 13px;
    }

    .page-title {
        font-size: 2.1rem;
        font-weight: 800;
        margin-bottom: 0.2rem;
    }

    .page-subtitle {
        color: #94a3b8;
        margin-bottom: 1rem;
    }

    .stDataFrame {
        border-radius: 14px;
        overflow: hidden;
    }
</style>
""", unsafe_allow_html=True)

# ---------------- TITLE ----------------
st.markdown('<div class="page-title">🧾 Reimbursement Management System</div>', unsafe_allow_html=True)
st.markdown('<div class="page-subtitle">Modern admin dashboard for expense workflows, approvals, rules, and analytics.</div>', unsafe_allow_html=True)

# ---------------- SESSION STATE ----------------
if 'expenses' not in st.session_state:
    st.session_state.expenses = pd.DataFrame({
        'id': [1,2,3,4,5,6],
        'employee': ['John Doe', 'John Doe', 'Jane Smith', 'Mike Wilson', 'Alex Brown', 'Sara Lee'],
        'amount': [150.5, 89.99, 250.0, 45.75, 420.0, 180.25],
        'currency': ['USD', 'EUR', 'USD', 'INR', 'USD', 'GBP'],
        'category': ['Travel', 'Meals', 'Hotel', 'Taxi', 'Office', 'Travel'],
        'date': ['2026-03-28', '2026-03-29', '2026-03-27', '2026-03-26', '2026-03-29', '2026-03-28'],
        'status': ['pending', 'approved', 'rejected', 'pending', 'approved', 'pending'],
        'current_approver': ['Jane Manager', 'Approved', 'Jane Manager', 'Jane Manager', 'Approved', 'Finance Team']
    })

if 'users' not in st.session_state:
    st.session_state.users = pd.DataFrame({
        'id': [1,2,3,4,5],
        'name': ['Admin User', 'John Doe', 'Jane Manager', 'Finance Lead', 'Director Mike'],
        'email': ['admin@company.com', 'john@company.com', 'jane@company.com', 'finance@company.com', 'director@company.com'],
        'role': ['Admin', 'Employee', 'Manager', 'Manager', 'Manager']
    })

if 'activity_log' not in st.session_state:
    st.session_state.activity_log = [
        "✅ Jane Manager approved Expense #2",
        "❌ Jane Manager rejected Expense #3",
        "🧾 John Doe submitted Expense #6",
        "⚙️ Admin updated approval rules",
        "👤 Admin added Finance Lead"
    ]

# ---------------- SIDEBAR ----------------
st.sidebar.markdown("## 📋 Navigation")
page = st.sidebar.selectbox(
    "Go to:",
    ["🏠 Dashboard", "➕ Submit Expense", "⏳ Approvals", "👥 Users", "⚙️ Rules"]
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 🎛️ Filters")
status_filter = st.sidebar.multiselect(
    "Status",
    options=sorted(st.session_state.expenses['status'].unique().tolist()),
    default=sorted(st.session_state.expenses['status'].unique().tolist())
)

category_filter = st.sidebar.multiselect(
    "Category",
    options=sorted(st.session_state.expenses['category'].unique().tolist()),
    default=sorted(st.session_state.expenses['category'].unique().tolist())
)

filtered_expenses = st.session_state.expenses[
    st.session_state.expenses['status'].isin(status_filter) &
    st.session_state.expenses['category'].isin(category_filter)
].copy()

# ---------------- HELPER FUNCTIONS ----------------
def metric_card(title, value, delta, delta_color="#22c55e"):
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">{title}</div>
        <div class="metric-value">{value}</div>
        <div class="metric-delta" style="color:{delta_color};">{delta}</div>
    </div>
    """, unsafe_allow_html=True)

def status_badge(status):
    colors = {
        "pending": "🟡 Pending",
        "approved": "🟢 Approved",
        "rejected": "🔴 Rejected"
    }
    return colors.get(status, status)

# ---------------- DASHBOARD ----------------
if page == "🏠 Dashboard":
    st.header("📊 Smart Admin Dashboard")

    total_users = len(st.session_state.users)
    pending_count = len(filtered_expenses[filtered_expenses['status'] == 'pending'])
    approved_count = len(filtered_expenses[filtered_expenses['status'] == 'approved'])
    rejected_count = len(filtered_expenses[filtered_expenses['status'] == 'rejected'])
    total_amount = filtered_expenses['amount'].sum()
    pending_amount = filtered_expenses[filtered_expenses['status'] == 'pending']['amount'].sum()

    # KPI CARDS
    c1, c2, c3, c4, c5, c6 = st.columns(6)
    with c1:
        metric_card("👥 Total Users", total_users, "+1 today")
    with c2:
        metric_card("⏳ Pending", pending_count, "Needs attention", "#f59e0b")
    with c3:
        metric_card("✅ Approved", approved_count, "+12% this week")
    with c4:
        metric_card("❌ Rejected", rejected_count, "Watch rejection rate", "#ef4444")
    with c5:
        metric_card("💰 Total Spend", f"${total_amount:,.0f}", "+25% MoM")
    with c6:
        metric_card("🕒 Pending Amount", f"${pending_amount:,.0f}", "In approval queue", "#06b6d4")

    # QUICK ACTIONS
    st.markdown("### ⚡ Quick Actions")
    qa1, qa2, qa3, qa4 = st.columns(4)
    with qa1:
        st.button("➕ Submit Expense", use_container_width=True)
    with qa2:
        st.button("👥 Manage Users", use_container_width=True)
    with qa3:
        st.button("⚙️ Configure Rules", use_container_width=True)
    with qa4:
        st.button("⏳ View Pending Approvals", use_container_width=True)

    # ROW 1 CHARTS
    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.subheader("🟠 Expense Status Overview")

        status_counts = filtered_expenses['status'].value_counts().reset_index()
        status_counts.columns = ['status', 'count']

        fig_status = px.pie(
            status_counts,
            names='status',
            values='count',
            hole=0.55,
            color='status',
            color_discrete_map={
                'pending': '#f59e0b',
                'approved': '#10b981',
                'rejected': '#ef4444'
            }
        )
        fig_status.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='white',
            margin=dict(t=10, b=10, l=10, r=10),
            showlegend=True
        )
        st.plotly_chart(fig_status, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.subheader("🔄 Approval Pipeline")

        pipeline_df = pd.DataFrame({
            "Stage": ["Submitted", "Manager Review", "Finance Review", "Final Approval"],
            "Count": [len(filtered_expenses), pending_count, max(1, pending_count-1), approved_count]
        })

        fig_pipeline = px.funnel(
            pipeline_df,
            x="Count",
            y="Stage",
            color="Stage",
            color_discrete_sequence=["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981"]
        )
        fig_pipeline.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='white',
            margin=dict(t=10, b=10, l=10, r=10),
            showlegend=False
        )
        st.plotly_chart(fig_pipeline, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # ROW 2 CHARTS
    col3, col4 = st.columns([1.2, 0.8])

    with col3:
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.subheader("📦 Spend by Category & Status")

        category_summary = filtered_expenses.groupby(['category', 'status'], as_index=False)['amount'].sum()

        fig_category = px.bar(
            category_summary,
            x='category',
            y='amount',
            color='status',
            barmode='stack',
            color_discrete_map={
                'pending': '#f59e0b',
                'approved': '#10b981',
                'rejected': '#ef4444'
            }
        )
        fig_category.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='white',
            margin=dict(t=10, b=10, l=10, r=10),
            xaxis_title="Category",
            yaxis_title="Amount"
        )
        st.plotly_chart(fig_category, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col4:
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.subheader("🚨 Smart Alerts")

        high_value = filtered_expenses[filtered_expenses['amount'] > 200]
        missing_receipts = 2  # demo
        bottleneck = "Jane Manager"

        st.markdown(f"""
        <div class="alert-box"><b>High-value expenses:</b> {len(high_value)} request(s) above $200</div>
        <div class="danger-box"><b>Missing receipts:</b> {missing_receipts} request(s) need documents</div>
        <div class="success-box"><b>Bottleneck approver:</b> {bottleneck} has most pending approvals</div>
        """, unsafe_allow_html=True)

        st.markdown("#### 💡 AI-style Insights")
        if not filtered_expenses.empty:
            top_category = filtered_expenses.groupby('category')['amount'].sum().idxmax()
            st.write(f"• **{top_category}** is currently the highest spend category.")
            st.write(f"• **{pending_count}** expenses are waiting in the approval queue.")
            st.write(f"• Approval rules can reduce delays by auto-routing high-value requests.")
        st.markdown('</div>', unsafe_allow_html=True)

    # ACTIVITY + TABLE
    left, right = st.columns([0.8, 1.2])

    with left:
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.subheader("🕘 Recent Activity")
        for item in st.session_state.activity_log:
            st.write(item)
        st.markdown('</div>', unsafe_allow_html=True)

    with right:
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.subheader("📋 Recent Expenses")

        display_df = filtered_expenses.copy()
        display_df['status'] = display_df['status'].apply(status_badge)

        st.dataframe(
            display_df[['id', 'employee', 'amount', 'currency', 'category', 'date', 'status', 'current_approver']].sort_values(by='id', ascending=False),
            use_container_width=True,
            hide_index=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

# ---------------- SUBMIT EXPENSE ----------------
elif page == "➕ Submit Expense":
    st.header("📤 Submit Expense Claim")

    with st.container(border=True):
        with st.form("expense_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                employee = st.selectbox("Employee", st.session_state.users['name'].tolist())
                category = st.selectbox("Category", ["Travel", "Meals", "Hotel", "Taxi", "Office", "Other"])
                exp_date = st.date_input("Date", value=date(2026, 3, 29))
            with col2:
                amount = st.number_input("Amount", min_value=0.01, value=50.0, step=0.01)
                currency = st.selectbox("Currency", ["USD", "EUR", "GBP", "INR"])
                description = st.text_area("Description", height=90)

            receipt = st.file_uploader("📷 Upload Receipt (OCR Preview)", type=['png', 'jpg', 'jpeg'])

            if receipt:
                st.image(receipt, caption="OCR Preview: Amount, Date, Merchant (demo)", width=300)
                st.info("🤖 OCR demo: Detected merchant, amount, and expense date from receipt.")

            submitted = st.form_submit_button("🚀 Submit for Approval", use_container_width=True)

            if submitted:
                new_id = len(st.session_state.expenses) + 1
                new_exp = pd.DataFrame({
                    'id': [new_id],
                    'employee': [employee],
                    'amount': [amount],
                    'currency': [currency],
                    'category': [category],
                    'date': [str(exp_date)],
                    'status': ['pending'],
                    'current_approver': ['Jane Manager']
                })
                st.session_state.expenses = pd.concat([st.session_state.expenses, new_exp], ignore_index=True)
                st.session_state.activity_log.insert(0, f"🧾 {employee} submitted Expense #{new_id}")
                st.success(f"✅ Expense #{new_id} submitted successfully! Sent to Jane Manager for approval.")
                st.balloons()

# ---------------- APPROVALS ----------------
elif page == "⏳ Approvals":
    st.header("🔄 Pending Approvals (Manager/Admin)")

    pending_exp = st.session_state.expenses[st.session_state.expenses['status'] == 'pending'].copy()

    if pending_exp.empty:
        st.info("🎉 No pending approvals!")
    else:
        for idx, row in pending_exp.iterrows():
            with st.container(border=True):
                st.markdown(f"### 💳 Expense #{row['id']} — {row['employee']}")
                c1, c2, c3, c4 = st.columns(4)
                c1.write(f"**Category:** {row['category']}")
                c2.write(f"**Amount:** ${row['amount']} {row['currency']}")
                c3.write(f"**Date:** {row['date']}")
                c4.write(f"**Current Approver:** {row['current_approver']}")

                comments = st.text_area("Comments", height=70, key=f"comment_{row['id']}")

                a1, a2 = st.columns(2)
                with a1:
                    if st.button(f"✅ Approve #{row['id']}", key=f"approve_{row['id']}", use_container_width=True):
                        st.session_state.expenses.loc[st.session_state.expenses['id'] == row['id'], 'status'] = 'approved'
                        st.session_state.expenses.loc[st.session_state.expenses['id'] == row['id'], 'current_approver'] = 'Approved'
                        st.session_state.activity_log.insert(0, f"✅ Approved Expense #{row['id']}")
                        st.rerun()

                with a2:
                    if st.button(f"❌ Reject #{row['id']}", key=f"reject_{row['id']}", use_container_width=True):
                        st.session_state.expenses.loc[st.session_state.expenses['id'] == row['id'], 'status'] = 'rejected'
                        st.session_state.activity_log.insert(0, f"❌ Rejected Expense #{row['id']}")
                        st.rerun()

# ---------------- USERS ----------------
elif page == "👥 Users":
    st.header("👨‍💼 User Management (Admin)")

    col1, col2 = st.columns([1.1, 0.9])

    with col1:
        with st.container(border=True):
            st.subheader("📋 Current Users")
            st.dataframe(st.session_state.users, use_container_width=True, hide_index=True)

    with col2:
        with st.container(border=True):
            st.subheader("➕ Add User")
            with st.form("user_form"):
                new_name = st.text_input("Name")
                new_email = st.text_input("Email")
                new_role = st.selectbox("Role", ["Employee", "Manager"])
                if st.form_submit_button("Add User", use_container_width=True):
                    if new_name and new_email:
                        new_id = len(st.session_state.users) + 1
                        new_user = pd.DataFrame({
                            'id': [new_id],
                            'name': [new_name],
                            'email': [new_email],
                            'role': [new_role]
                        })
                        st.session_state.users = pd.concat([st.session_state.users, new_user], ignore_index=True)
                        st.session_state.activity_log.insert(0, f"👤 Added user {new_name}")
                        st.success("User added successfully!")
                    else:
                        st.warning("Please enter both name and email.")

# ---------------- RULES ----------------
elif page == "⚙️ Rules":
    st.header("⚙️ Approval Rules Configuration")

    r1, r2 = st.columns([1.2, 0.8])

    with r1:
        with st.container(border=True):
            st.subheader("📜 Existing Rules")

            rules_df = pd.DataFrame({
                "Rule Name": ["Manager First", "Majority Vote", "CFO Override"],
                "Type": ["specific", "percentage", "specific"],
                "Value": ["jane@company.com", "60%", "cfo@company.com"],
                "Sequence": [1, 2, 3]
            })
            st.dataframe(rules_df, use_container_width=True, hide_index=True)

    with r2:
        with st.container(border=True):
            st.subheader("➕ Add / Update Rule")
            with st.form("rule_form"):
                rule_name = st.text_input("Rule Name")
                rule_type = st.selectbox("Type", ["percentage", "specific", "hybrid"])
                rule_value = st.text_input("Value (60 or email)")
                sequence = st.number_input("Sequence Order", min_value=1, value=1)
                manager_first = st.checkbox("Is manager first approver?")
                parallel_mode = st.checkbox("Parallel approvals?")

                if st.form_submit_button("Save Rule", use_container_width=True):
                    st.session_state.activity_log.insert(0, f"⚙️ Updated rule: {rule_name}")
                    st.success("Rule saved successfully!")

# ---------------- FOOTER ----------------
st.sidebar.markdown("---")
st.sidebar.markdown("""
### 🚀 Demo Features
- ✅ Submit expenses with receipt upload
- ✅ Approve / Reject workflow
- ✅ Smart dashboard metrics & charts
- ✅ User management
- ✅ Approval rules
- 💾 Data persists in session

### 🔜 Next Up
- SQLite / PostgreSQL
- JWT Authentication
- OCR extraction
- Email notifications
- Role-based access
""")