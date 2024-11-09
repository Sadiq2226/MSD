const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    name: { type: String, required: true },
    institution: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], required: true },
    email: { type: String, unique: true, required: true },
    studentId: { type: String, unique: true, required: function() { return this.role === 'student'; } }, // Ensure only students have a studentId
    password: { type: String, required: true }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
