// src/utils/reset-token.js
//
// Generates password-reset tokens the same way any secure app does:
// a random value is emailed to the user, but only a HASH of it is
// ever stored in the database. If the DB leaked, the stored hash
// alone isn't enough to reset anyone's password.

import crypto from 'crypto';

/**
 * @returns {{ rawToken: string, tokenHash: string }}
 *   rawToken  - goes into the emailed link, never stored in the DB
 *   tokenHash - goes into the database
 */
export const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return { rawToken, tokenHash };
};

/** @param {string} rawToken - the token straight from the link's ?token= param */
export const hashResetToken = rawToken =>
  crypto.createHash('sha256').update(rawToken).digest('hex');
