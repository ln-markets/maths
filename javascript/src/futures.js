import { SATOSHI } from './const.js'

/**
 *  Compute the position PL
 *
 * @param {object} position Position parameters object
 * @param {string} position.side Side Buy or Sell
 * @param {number} position.quantity Quantity
 * @param {number} position.price Position entry price
 * @param {object} market Last price
 * @param {number} market.bid LN Markets bid
 * @param {number} market.offer LN Markets offer
 * @returns {number} Position pl
 */
export const computePl = ({ side, quantity, price }, { bid, offer }) => {
  const sign = side === 'b' ? 1 : -1
  const current = side === 'b' ? bid : offer

  return Math.round(sign * quantity * SATOSHI * (1 / price - 1 / current))
}
