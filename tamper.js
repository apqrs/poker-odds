const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
const CARD_SUITS = ['s', 'c', 'h', 'd']
const RANK_NAMES = [
    'high card',
    'one pair',
    'two pair',
    'three of a kind',
    'straight',
    'flush',
    'full house',
    'four of a kind',
    'straight flush',
    'royal flush'
]
const NUMERICAL_VALUES = {
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14
}
const STRAIGHTS = [
    'AKQJT',
    'KQJT9',
    'QJT98',
    'JT987',
    'T9876',
    '98765',
    '87654',
    '76543',
    '65432',
    '5432A'
]

function numericalValue(card) {
    return NUMERICAL_VALUES[card[0]] || parseInt(card[0])
}

function numericalSort(a, b) {
    return numericalValue(b) - numericalValue(a)
}

function convertToHex(input) {
    input = typeof input === 'string' ? input.split('') : input
    return input
        .map(c => numericalValue(c).toString(16))
        .join('')
}

function parseCards(string) {
    if (!string) {
        return undefined
    }
    return string.match(/[AKQJT2-9.][schd.]/g) || undefined
}

function percent(number) {
    if (number === 0) {
        return '·'
    }
    if (number > 0 && number < 0.001) {
        return '0.1%'
    }
    return `${round(number * 100)}%`
}

function seconds(ms) {
    if (ms >= 1000) {
        return `${round(ms / 1000)}s`
    }
    return `${ms}ms`
}

function getStraight(hand) {
    const values = hand.join('')
    const suffix = values[0] === 'A' ? 'A' : '' // Append A to capture 5432A
    for (let i = 0; i !== STRAIGHTS.length; i++) {
        if (`${values}${suffix}`.includes(STRAIGHTS[i])) {
            return convertToHex(STRAIGHTS[i])
        }
    }
    return null
}

function padStart(string, length, padString = ' ') {
    if (string.length >= length) {
        return string
    }
    return padString.repeat(length - string.length) + string
}

function padEnd(string, length, padString = ' ') {
    if (string.length >= length) {
        return string
    }
    return string + padString.repeat(length - string.length)
}

function round(number, dp = 1) {
    const multiplier = dp * 10
    return (Math.round(number * multiplier) / multiplier).toFixed(dp)
}
function createDeck(withoutCards = []) {
    const deck = []
    for (let i = 0; i !== CARD_VALUES.length; i++) {
        for (let j = 0; j !== CARD_SUITS.length; j++) {
            const card = CARD_VALUES[i] + CARD_SUITS[j]
            if (!withoutCards.includes(card)) {
                deck.push(card)
            }
        }
    }
    return deck
}

function deal(withoutCards, count) {
    const cards = []
    while (cards.length !== count) {
        const index = Math.floor(Math.random() * FULL_DECK.length)
        const card = FULL_DECK[index]
        if (!cards.includes(card) && !withoutCards.includes(card)) {
            cards.push(card)
        }
    }
    return cards
}

function rankValues (values) {
    let total = 0
    let max = 0
    const cardMatches = {}
    for (let i = 0; i !== values.length; i++) {
      cardMatches[values[i]] = 0
      for (let j = 0; j !== values.length; j++) {
        if (i === j) continue // TODO: Could this be i <= j?
        const first = values[i]
        const second = values[j]
        if (first === second) {
          cardMatches[first]++
          total++
          max = Math.max(cardMatches[first], max)
        }
      }
    }
    const matches = total / 2
    const straight = getStraight(dedupe(values)) // Dedupe to match straights like AKKKQJT
    const kickers = convertToHex(values.sort((a, b) => cardMatches[b] - cardMatches[a]))
  
    if (max > 3) {
      return undefined
    }
    if (max === 3) {
      return '7' + kickers.slice(0, 4) + getHighestKicker(kickers.slice(4)) // four of a kind
    }
    if (max === 2 && matches > 3) {
      return '6' + kickers.slice(0, 5) // full house
    }
    if (straight) {
      return '4' + straight // straight
    }
    if (max === 2) {
      return '3' + kickers.slice(0, 5) // three of a kind
    }
    if (max === 1 && matches > 1) {
      return '2' + kickers.slice(0, 4) + getHighestKicker(kickers.slice(4)) // two pair
    }
    if (max === 1) {
      return '1' + kickers.slice(0, 5) // one pair
    }
    return '0' + kickers.slice(0, 5) // high card
  }
  
  function  rankHand(input) {
    const hand = input.slice(0).sort(numericalSort)
    const values = hand.map(c => c[0]).join('')
    const suits = hand.map(c => c[1]).sort().join('')
  
    const rank = lookup.rank[values]
    const flush = lookup.flush[suits]
  
    if (!rank) {
      throw Error(`Invalid hand: ${hand.join(' ')}`)
    }
  
    const straight = rank[0] === '4'
  
    if (straight && flush) {
      const flushed = hand.filter(c => c[1] === flush).map(c => c[0])
      const kickers = getStraight(flushed)
      if (kickers) {
        // royal or straight flush
        return (kickers[0] === 'e' ? '9' : '8') + kickers
      }
    }
    if (flush) {
      // Fix kickers for flush
      // ie the highest cards of the flush suit
      const kickers = convertToHex(hand.filter(c => c[1] === flush).slice(0, 5))
      return '5' + kickers // flush
    }
    return rank
  }
  
  function getFlush (string) {
    const match = string.match(/(s{5}|c{5}|d{5}|h{5})/)
    return match ? match[0][0] : undefined
  }
  
  function getHighestKicker (string) {
    return string.split('').sort().reverse()[0]
  }
  
  function dedupe (array) {
    return array.filter(function (item, index, array) {
      return array.indexOf(item) === index
    })
  }

  export function calculateEquity (hands, board = [], iterations = 100000, exhaustive = false) {
    let results = hands.map(hand => ({
      hand,
      count: 0,
      wins: 0,
      ties: 0,
      handChances: RANK_NAMES.map(name => ({ name, count: 0 }))
    }))
    if (board.length === 5) {
      results = analyse(results, board)
    } else if (board.length >= 3) {
      const deck = createDeck(board.concat(...hands))
      for (let i = 0; i !== deck.length; i++) {
        if (board.length === 4) {
          results = analyse(results, board.concat(deck[i]))
          continue
        }
        for (let j = 0; j !== deck.length; j++) {
          if (i >= j) continue
          results = analyse(results, board.concat([ deck[i], deck[j] ]))
        }
      }
    } else if (exhaustive) {
      const deck = createDeck(board.concat(...hands))
      for (let a = 0; a !== deck.length; a++) {
        for (let b = 0; b !== deck.length; b++) {
          if (a <= b) continue
          for (let c = 0; c !== deck.length; c++) {
            if (b <= c) continue
            for (let d = 0; d !== deck.length; d++) {
              if (c <= d) continue
              for (let e = 0; e !== deck.length; e++) {
                if (d <= e) continue
                results = analyse(results, [deck[a], deck[b], deck[c], deck[d], deck[e]])
              }
            }
          }
        }
      }
    } else {
      for (let i = 0; i !== iterations; i++) {
        const randomCards = deal([].concat(...hands), 5 - board.length)
        results = analyse(results, board.concat(randomCards))
      }
    }
    const maxWins = Math.max(...results.map(hand => hand.wins))
    return results.map(hand => ({
      ...hand,
      favourite: hand.wins === maxWins
    }))
  }
  
  function analyse (results, board) {
    const ranks = results.map(result => {
      if (result.hand.includes('..')) {
        const randomCards = deal(board.concat(...results.map(r => r.hand)), 4)
        const hand = result.hand.map((card, index) => {
          if (card === '..') {
            return randomCards[index]
          }
          return card
        })
        return (hand.concat(board))
      }
      return (result.hand.concat(board))
    })
    const bestRank = ranks.slice(0).sort().reverse()[0]
    const tie = ranks.filter(rank => rank === bestRank).length > 1
    for (let i = 0; i !== results.length; i++) {
      if (ranks[i] === bestRank) {
        if (tie) {
          results[i].ties++
        } else {
          results[i].wins++
        }
      }
      results[i].count++
      results[i].handChances[parseInt(ranks[i][0])].count++
    }
    return results
  }
