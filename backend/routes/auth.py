import os
import random
import uuid
import requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session
from backend.models import db, user_schema, vehicle_schema  # <--- ADD vehicle_schema
from bson.objectid import ObjectId
import bcrypt

# IMPORTANT: Import the sender from utils to avoid circular import crashes
from backend.utils import send_telegram_message

auth_bp = Blueprint('auth_bp', __name__)

# ... [Keep the /register route exactly as it is] ...

# ---------------------------------------------------------
# 2. LOGIN (Updated to check for Banned Users)
# ---------------------------------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = db.users.find_one({"email": email})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        
        # --- NEW: Check if Banned ---
        if not user.get('is_active', True):
            return jsonify({"error": "Your account has been suspended by an administrator."}), 403
        # ----------------------------

        # Check if Telegram is Linked
        chat_id = user.get('telegram_chat_id')
        
        if chat_id:
            # --- START 2FA FLOW ---
            otp = str(random.randint(100000, 999999))
            
            # Save OTP to DB (Valid for 5 mins)
            db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "otp_code": otp,
                    "otp_expiry": datetime.utcnow() + timedelta(minutes=5)
                }}
            )
            
            # Send Code via Utility
            msg = f"🔐 *MotariLog Login*\n\nYour verification code is: `{otp}`\n\n(Valid for 5 minutes)"
            sent = send_telegram_message(chat_id, msg)
            
            if sent:
                session['pending_2fa_user_id'] = str(user['_id'])
                return jsonify({
                    "status": "2fa_required",
                    "message": "Verification code sent to Telegram"
                }), 202
            
            print("❌ Failed to send Telegram 2FA. Logging in normally.")

        # --- NORMAL LOGIN ---
        session['user_id'] = str(user['_id'])
        return jsonify({
            "message": "Login successful", 
            "user": user_schema.dump(user)
        }), 200

    return jsonify({"error": "Invalid email or password"}), 401

# ... [Keep /verify-2fa, /logout, /profile, /telegram/link, /telegram/unlink, /telegram/test-alert AS IS] ...

# ---------------------------------------------------------
# 9. ADMIN: GET ALL USERS (NEW)
# ---------------------------------------------------------
@auth_bp.route('/admin/users', methods=['GET'])
def get_all_users():
    user_id = session.get('user_id')
    if not user_id: return jsonify({'error': 'Unauthorized'}), 401
    
    # Verify Admin
    curr_user = db.users.find_one({"_id": ObjectId(user_id)})
    if not curr_user or curr_user.get('role') != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    # Fetch Users
    users_cursor = db.users.find()
    users_data = []
    
    for u in users_cursor:
        u_data = user_schema.dump(u)
        
        # Attach Vehicles manually since they are in a different collection
        vehicles = list(db.vehicles.find({"user_id": u["_id"]}))
        u_data['vehicles'] = [vehicle_schema.dump(v) for v in vehicles]
        
        users_data.append(u_data)

    return jsonify(users_data), 200

# ---------------------------------------------------------
# 10. ADMIN: BAN/UNBAN USER (NEW)
# ---------------------------------------------------------
@auth_bp.route('/admin/users/<string:target_id>/ban', methods=['POST'])
def ban_user(target_id):
    user_id = session.get('user_id')
    if not user_id: return jsonify({'error': 'Unauthorized'}), 401
    
    # Verify Admin
    curr_user = db.users.find_one({"_id": ObjectId(user_id)})
    if not curr_user or curr_user.get('role') != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    target = db.users.find_one({"_id": ObjectId(target_id)})
    if not target: return jsonify({'error': 'User not found'}), 404
    
    # Prevent banning self (optional but good practice)
    if str(target['_id']) == str(curr_user['_id']):
        return jsonify({'error': 'Cannot ban yourself'}), 400

    # Toggle status
    current_status = target.get('is_active', True)
    new_status = not current_status
    
    db.users.update_one(
        {"_id": ObjectId(target_id)}, 
        {"$set": {"is_active": new_status}}
    )
    
    # Send Telegram Notification if Banning
    if new_status is False:
        chat_id = target.get('telegram_chat_id')
        if chat_id:
            msg = (
                "⛔ **Account Suspended**\n\n"
                "Your MotriLog account has been suspended by an administrator.\n"
                "You will no longer be able to log in."
            )
            send_telegram_message(chat_id, msg)

    return jsonify({
        'message': 'User status updated', 
        'is_active': new_status
    }), 200
