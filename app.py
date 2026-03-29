from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# -------------------------------
# Database Connection
# -------------------------------
def get_db_connection():
    conn = sqlite3.connect('reimbursement.db', timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------------
# Create Tables
# -------------------------------
def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Companies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT,
        country TEXT,
        currency TEXT
    )
    """)

    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        company_id INTEGER,
        FOREIGN KEY(company_id) REFERENCES companies(id)
    )
    """)

    # Approval Rules
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS approval_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        manager_id INTEGER,
        is_manager_approver BOOLEAN,
        sequence BOOLEAN,
        min_approval INTEGER,
        company_id INTEGER,
        FOREIGN KEY(manager_id) REFERENCES users(id),
        FOREIGN KEY(company_id) REFERENCES companies(id)
    )
    """)

    # Rule Approvers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rule_approvers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id INTEGER,
        user_id INTEGER,
        required BOOLEAN,
        FOREIGN KEY(rule_id) REFERENCES approval_rules(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()

# Run table creation once
create_tables()

# -------------------------------
# Home Route
# -------------------------------
@app.route('/')
def home():
    return "Backend is running ✅"

# -------------------------------
# Signup API
# -------------------------------
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert Company
        cursor.execute("""
            INSERT INTO companies (company_name, country, currency)
            VALUES (?, ?, ?)
        """, (
            data["companyName"],
            data["country"],
            data["currency"]
        ))
        company_id = cursor.lastrowid

        # Insert Admin User
        cursor.execute("""
            INSERT INTO users (full_name, email, password, role, company_id)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data["fullName"],
            data["email"],
            data["password"],
            "ADMIN",
            company_id
        ))

        conn.commit()
        conn.close()

        return jsonify({"message": "Signup successful"})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Login API
# -------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            (data["email"], data["password"])
        )

        user = cursor.fetchone()
        conn.close()

        if user:
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": user["id"],
                    "name": user["full_name"],
                    "email": user["email"],
                    "role": user["role"]
                }
            })
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Get Users API
# -------------------------------
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, full_name FROM users")
        users = cursor.fetchall()
        conn.close()

        user_list = [{"id": u["id"], "name": u["full_name"]} for u in users]

        return jsonify(user_list)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Create Approval Rule API
# -------------------------------
@app.route('/api/approval_rule', methods=['POST'])
def create_approval_rule():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO approval_rules 
            (description, manager_id, is_manager_approver, sequence, min_approval, company_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data["description"],
            data.get("manager"),
            data.get("isManagerApprover", False),
            data.get("sequence", False),
            data.get("minApproval", 100),
            data.get("companyId", 1)
        ))

        rule_id = cursor.lastrowid

        approvers = data.get("approvers", [])
        for a in approvers:
            cursor.execute("""
                INSERT INTO rule_approvers (rule_id, user_id, required)
                VALUES (?, ?, ?)
            """, (rule_id, a["id"], a.get("required", False)))

        conn.commit()
        conn.close()

        return jsonify({"message": "Approval rule created successfully", "ruleId": rule_id})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

# -------------------------------
# Get All Approval Rules API
# -------------------------------
@app.route('/api/approval_rules', methods=['GET'])
def get_approval_rules():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM approval_rules")
        rules = cursor.fetchall()

        result = []
        for r in rules:
            cursor.execute("""
                SELECT u.id, u.full_name, ra.required
                FROM rule_approvers ra
                JOIN users u ON ra.user_id = u.id
                WHERE ra.rule_id = ?
            """, (r["id"],))
            approvers = cursor.fetchall()

            approvers_list = [{"id": a["id"], "name": a["full_name"], "required": bool(a["required"])} for a in approvers]

            result.append({
                "id": r["id"],
                "description": r["description"],
                "manager": r["manager_id"],
                "isManagerApprover": bool(r["is_manager_approver"]),
                "sequence": bool(r["sequence"]),
                "minApproval": r["min_approval"],
                "approvers": approvers_list
            })

        conn.close()
        return jsonify(result)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500
    
# GET expenses for a user
@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    user_id = request.args.get("userId")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM expenses WHERE user_id = ?", (user_id,)
    )
    expenses = cursor.fetchall()
    result = [dict(e) for e in expenses]
    conn.close()
    return jsonify(result)

# POST new expense
@app.route("/api/expenses", methods=["POST"])
def create_expense():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            description TEXT,
            amount REAL,
            date TEXT,
            category TEXT,
            status TEXT,
            receipt_file TEXT
        )
    """)
    conn.commit()
    cursor.execute("""
        INSERT INTO expenses (user_id, description, amount, date, category, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data["user_id"], data["description"], data["amount"],
        data["date"], data["category"], data.get("status", "Draft")
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Expense saved"})

# -------------------------------
# Run Server
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=8080)