/**
 * Core type definitions for endfield-reverse
 * Based on endfield-calc by JamboChen (MIT License)
 * @see https://github.com/JamboChen/endfield-calc
 */

import type { ItemId, RecipeId, FacilityId } from './constants'

export type { ItemId, RecipeId, FacilityId }

export type Item = {
  id: ItemId
  tier: number
  asTarget?: boolean
}

export type RecipeItem = {
  itemId: ItemId
  amount: number
}

export type Recipe = {
  id: RecipeId
  inputs: RecipeItem[]
  outputs: RecipeItem[]
  facilityId: FacilityId
  /** Crafting time in seconds */
  craftingTime: number
}

export type Facility = {
  id: FacilityId
  powerConsumption: number
  tier: number
}
