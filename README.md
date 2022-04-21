# Maths

<p align="center">
  <a href="https://twitter.com/LNMarkets">
    <img src="https://img.shields.io/twitter/follow/LNMarkets?style=social"
        alt="Follow us on Twitter">
  </a>
</p>

This repo contain mathematical formula for LN Markets in different languages such as :

- [Javascript](./javascript/README.md)

Python version comming soon

## Futures

#### computeFuturesPositionPl

Compute the PL of a position with the bid and offer

```yaml
position:
  type: Object
  required: true
  params:
    side:
      type: String
      required: true
      enum: ["b", "s"]
    quantity:
      type: Integer
      required: true
    price:
      type: Integer
      required: true
market:
  type: Object
  required: true
  params:
    offer:
      type: Integer
      required: true
    bid:
      type: Float
      required: true
```

## Options

### computeVanillaOptionDelta

Delta of an option at given market price

```yaml
# LN Markets options trade object
trades:
  type: Object
  required: true
market:
  type: Object
  required: true
  params:
    offer:
      type: Integer
      required: true
    bid:
      type: Float
      required: true
```

### computeVanillaOptionPl

Pl of an option at given market price

```yaml
# LN Markets options trade object
trades:
  type: Object
  required: true
market:
  type: Object
  required: true
  params:
    offer:
      type: Integer
      required: true
    bid:
      type: Float
      required: true
```
