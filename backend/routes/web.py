from flask import Blueprint, render_template, session
from backend.models import db
from bson.objectid import ObjectId

# Create the Blueprint
web_bp = Blueprint('web_bp', __name__)

# --- Routes ---

@web_bp.route('/')
def main_page():
    return render_template("Main_Page.html")

@web_bp.route('/dashboard')
def dashboard():
    # 1. Get the current user's ID from the session
    user_id = session.get('user_id')
    
    # 2. Default role is 'user' (hidden panel)
    user_role = 'user'
    
    # 3. If logged in, check the database for the real role
    if user_id:
        try:
            # We use db.users because 'db' is the database object from models.py
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user_role = user.get('role', 'user')
        except Exception as e:
            print(f"Error fetching user role: {e}")

    # 4. Pass the user_role to the HTML template
    return render_template('dashboard.html', user_role=user_role)

@web_bp.route('/login')
def login():
    return render_template('login.html')

@web_bp.route('/register')
def register():
    return render_template('register.html')

@web_bp.route('/vehicle-details')
def vehicle_details():
    return render_template('vehicledetails.html')

@web_bp.route('/workshops')
def workshops():
    # 1. Get User ID
    user_id = session.get('user_id')
    user_role = 'user'

    # 2. Check Role in Database
    if user_id:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user_role = user.get('role', 'user')
        except Exception:
            pass

    # 3. Pass 'user_role' to the template
    return render_template('workshop.html', user_role=user_role)
@web_bp.route('/addvehicle')
def add_vehicle():
    # Note: Ensure the file name matches exactly what is in your templates folder
    return render_template('addvehicle.html')
