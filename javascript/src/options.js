import { SATOSHI } from './const.js'

const { sqrt, exp, log, floor, abs } = Math

const mean = 0
const variance = 1
const standardDeviation = sqrt(variance)

const erfc = (x) => {
  const z = abs(x)
  const t = 1 / (1 + z / 2)
  const r =
    t *
    exp(
      -z * z -
        1.265_512_23 +
        t *
          (1.000_023_68 +
            t *
              (0.374_091_96 +
                t *
                  (0.096_784_18 +
                    t *
                      (-0.186_288_06 +
                        t *
                          (0.278_868_07 +
                            t *
                              (-1.135_203_98 +
                                t *
                                  (1.488_515_87 +
                                    t *
                                      (-0.822_152_23 + t * 0.170_872_77))))))))
    )
  return x >= 0 ? r : 2 - r
}

const cdf = (x) => {
  return 0.5 * erfc(-(x - mean) / (standardDeviation * sqrt(2)))
}

const bs_price = ({ type, S, K, T, r, v, q }) => {
  const d1 = (log(S / K) + (r + (v * v) / 2) * T) / (v * sqrt(T))
  const d2 = d1 - v * sqrt(T)
  return type === 'c'
    ? S * exp(-q * T) * cdf(d1) - K * exp(-r * T) * cdf(d2)
    : K * exp(-r * T) * cdf(-d2) - S * exp(-q * T) * cdf(-d1)
}

const bs_delta = ({ type, S, K, T, r, v }) => {
  const d1 = (log(S / K) + (r + (v * v) / 2) * T) / (v * sqrt(T))
  return type === 'c' ? cdf(d1) : cdf(d1) - 1
}

const S = ({ forward, forward_point, domestic }) => {
  const temporary = forward + forward_point

  if (domestic === 'BTC') {
    return 1 / temporary
  }
  return temporary
}

const K = ({ domestic, strike }) => {
  if (domestic === 'BTC') {
    return 1 / strike
  }
  return strike
}

/**
 * Get the day number in a yeat with a date
 *
 * @param {Date} date Date object
 * @returns {number} Which day is it during the year
 */
export const dayOfYear = (date) => {
  return floor(
    (date - new Date(date.getFullYear(), 0, 1)) / 1000 / 60 / 60 / 24
  )
}

/**
 * Get the hour number in a yeat with a date
 *
 * @param {Date} date Date object
 * @returns {number} Which hour is it during the year
 */
export const hourOfTheYear = (date) => {
  return floor((date - new Date(date.getFullYear(), 0, 1)) / 1000 / 60 / 60)
}

/**
 *
 * @param {object} args Function args
 * @param {number} args.expiry_ts Unix timestamp when the trade is going to expiry_ts
 * @param {number} args.creation_ts Unix timestamp when trade has been created
 * @returns {number} Trade maturity
 */
export const T = ({ expiry_ts, creation_ts }) => {
  return (expiry_ts - creation_ts) / (365 * 24 * 60 * 60 * 1000)
}

/**
 * Change the type of the trade selon le domestic currency
 *
 * @param {object} args Function args
 * @param {string} args.domestic Trade domestic
 * @param {string} args.type Trade type
 * @returns {string} Computed type
 */
export const computeType = ({ domestic, type }) => {
  if (domestic === 'BTC') {
    if (type === 'c') return 'p'
    return 'c'
  }
  return type
}

const computeSign = ({ side }) => {
  if (side === 'b') return 1
  return -1
}

const computePrice = (
  { domestic, expiry_ts, creation_ts, forward, forward_point },
  { type, volatility, strike }
) => {
  const temporary = bs_price({
    type: computeType({ domestic, type }),
    S: S({ forward, forward_point, domestic }),
    K: K({ domestic, strike }),
    T: T({ expiry_ts, creation_ts }),
    v: volatility,
    r: 0,
    q: 0,
  })

  if (domestic === 'BTC') {
    return temporary * strike * SATOSHI
  }

  return temporary * SATOSHI
}

/**
 * Compute the trade Mark To Market or premium with a leg
 *
 * @param {object} trade - Trade parameters
 * @param {string} trade.domestic - Domestic currency
 * @param {number} trade.creation_ts - Trade creation to compute maturity
 * @param {number} trade.expiry_ts - Trade expiration
 * @param {number} trade.forward - Trade forward
 * @param {number} trade.forward_point - Trade forward point
 * @param {object} leg - Trade leg
 * @param {string} leg.side - Leg side b or s
 * @param {string} leg.type - Leg type p or c
 * @param {number} leg.volatility - Leg volatility in decimal (ie 0.5)
 * @param {number} leg.quantity - Leg quantity in domestic currency
 * @param {number} leg.strike - Leg strike
 * @returns {number} MTM of the trade
 */
export const computeMarkToMarket = (trade, leg) => {
  const { domestic, expiry_ts, creation_ts, forward, forward_point = 0 } = trade
  const { side, quantity, strike, type, volatility } = leg

  const p = computePrice(
    { domestic, expiry_ts, creation_ts, forward, forward_point },
    { type, volatility, strike }
  )

  if (domestic === 'BTC') {
    const mtm = (quantity * p * computeSign({ side })) / strike
    return Number.parseInt(mtm)
  }

  return (
    (quantity * p * computeSign({ side })) /
    S({ forward, forward_point, domestic })
  )
}

/**
 * Compute the trade delta with a leg
 *
 * @param {object} trade - Trade parameters
 * @param {string} trade.domestic - Domestic currency
 * @param {number} trade.creation_ts - Trade creation to compute maturity
 * @param {number} trade.expiry_ts - Trade expiration
 * @param {number} trade.forward - Trade forward
 * @param {number} trade.forward_point - Trade forward point
 * @param {object} leg - Trade leg
 * @param {string} leg.side - Leg side b or s
 * @param {string} leg.type - Leg type p or c
 * @param {number} leg.volatility - Leg volatility in decimal (ie 0.5)
 * @param {number} leg.quantity - Leg quantity in domestic currency
 * @param {number} leg.strike - Leg strike
 * @returns {number} delta of the trade
 */
export const computeDelta = (trade, leg) => {
  const { side, type, volatility, quantity, strike } = leg
  const { domestic, creation_ts, expiry_ts, forward, forward_point = 0 } = trade

  const delta =
    bs_delta({
      type: computeType({ domestic, type }),
      S: S({ forward, forward_point, domestic }),
      K: K({ domestic, strike }),
      T: T({ expiry_ts, creation_ts }),
      v: volatility,
      r: 0,
    }) * computeSign({ side })

  if (domestic === 'BTC') {
    return quantity * -delta
  }

  return quantity * delta - computeMarkToMarket(trade, leg)
}

/**
 * Compute Vanilla Options PL with the current market state
 *
 * @param {object} trade LN Markets trade from API
 * @param {object} market Futures bid and offer object
 * @returns {number} Vanilla option PL
 */
export const computeVanillaOptionPl = (trade, market) => {
  const { bid, offer } = market
  const forward = trade.type === 'c' ? bid : offer
  const creation_ts = Date.now()

  return (
    Number.parseInt(
      computeMarkToMarket({ ...trade, forward, creation_ts }, trade)
    ) - trade.margin
  )
}

/**
 * Compute Vanilla Option delta with current market state
 *
 * @param {object} trade LN Markets trade from API
 * @param {object} market Futures bid and offer object
 * @returns {number} Vanilla option delta
 */
export const computeVanillaOptionDelta = (trade, market) => {
  const { bid, offer } = market
  const forward = trade.type === 'c' ? bid : offer
  const creation_ts = Date.now()

  return Number.parseInt(
    computeDelta({ ...trade, forward, creation_ts }, trade)
  )
}
