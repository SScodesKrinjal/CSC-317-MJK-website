const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

//helper function to get DB connection
function getDb() {
    return new sqlite3.Database(
        path.join(__dirname, '..', 'database', 'users.sqlite'),
        sqlite3.OPEN_READWRITE
    );
}

//profile page: shows user info + purchase history
router.get('/', (req, res) => {
    console.log('Profile page accessed, session:', req.session);

    if (!req.session?.userId) {
        return res.render('profile', {
            user: null,
            purchaseHistory: [],
            message: 'Please log in to view your profile'
        });
    }

    const db = getDb();

    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Error fetching user:', err);
            db.close();
            return res.render('profile', {
                user: null,
                purchaseHistory: [],
                error: 'Error fetching user data'
            });
        }

        if (!user) {
            console.log('No user found for ID:', req.session.userId);
            db.close();
            return res.render('profile', {
                user: null,
                purchaseHistory: [],
                error: 'User not found'
            });
        }

        db.all(`
            SELECT n.*, p.purchase_date
            FROM purchases p
            JOIN NFTs n ON p.nft_id = n.id
            WHERE p.user_id = ?
            ORDER BY p.purchase_date DESC
        `, [req.session.userId], (err, purchaseHistory) => {
            if (err) {
                console.error('Error fetching purchase history:', err);
            }

            db.close();

            const error = req.query.error || null;
            const message = req.query.message || null;

            res.render('profile', {
                user: user,
                purchaseHistory: purchaseHistory || [],
                message: message,
                error: error
            });
        });
    });
});

//update password
router.post('/update-password', (req, res) => {
    console.log('Password update requested');

    if (!req.session?.userId) {
        return res.status(401).render('login', { error: 'Please log in' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    console.log('Password update details received:', { currentPassword, newPassword, confirmPassword });

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.redirect('/profile?error=' + encodeURIComponent('All password fields are required'));
    }

    if (newPassword !== confirmPassword) {
        return res.redirect('/profile?error=' + encodeURIComponent('New passwords do not match'));
    }

    const db = getDb();

    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            db.close();
            return res.redirect('/profile?error=' + encodeURIComponent('Database Error'));
        }

        if (!user) {
            db.close();
            return res.redirect('/profile?error=' + encodeURIComponent('User not Found'));
        }

        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt error:', err);
                db.close();
                return res.redirect('/profile?error=' + encodeURIComponent('Internal Error'));
            }

            if (!isMatch) {
                db.close();
                return res.redirect('/profile?error=' + encodeURIComponent('Current password is incorrect'));
            }

            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Hashing error:', err);
                    db.close();
                    return res.redirect('/profile?error=' + encodeURIComponent('Error updating password'));
                }

                db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.userId], function (err) {
                    db.close();
                    if (err) {
                        console.error('Error updating password:', err);
                        return res.redirect('/profile?error=' + encodeURIComponent('Error updating password'));
                    }

                    res.redirect('/profile?message=Password%20updated%20successfully');
                });
            });
        });
    });
});


//update username
router.post('/update-username', (req, res) => {
    console.log('Username update requested:', req.body);

    if (!req.session?.userId) {
        return res.redirect('/profile?error=' + encodeURIComponent('Please log in'));
    }

    const { username } = req.body;
    if (!username) {
        return res.redirect('/profile?error=' + encodeURIComponent('Username is required'));
    }

    const db = getDb();

    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
            console.error('Error or user not found:', err);
            db.close();
            return res.redirect('/profile?error=' + encodeURIComponent('User not found'));
        }

        db.get('SELECT id FROM users WHERE username = ? AND id != ?',
            [username, req.session.userId],
            (err, existing) => {
                if (err) {
                    console.error('Error checking username:', err);
                    db.close();
                    return res.redirect('/profile?error=' + encodeURIComponent('Database error'));
                }

                if (existing) {
                    db.close();
                    return res.redirect('/profile?error=' + encodeURIComponent('Username already taken'));
                }

                db.run('UPDATE users SET username = ? WHERE id = ?',
                    [username, req.session.userId],
                    function (err) {
                        console.log('Update result:', err || 'Success', this.changes);
                        db.close();

                        if (err) {
                            return res.redirect('/profile?error=' + encodeURIComponent('Error updating username'));
                        }

                        req.session.username = username;
                        req.session.save();
                        res.redirect('/profile?message=' + encodeURIComponent('Username updated successfully'));
                    }
                );
            }
        );
    });
});

//logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.redirect('/?message=Logout%20successful');
    });
});

module.exports = router;
