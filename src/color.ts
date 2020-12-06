import { HSLColor, rgb, RGBColor } from 'd3-color'

// function mixColorFieldss<T extends HSLColor | RGBColor, K extends keyof T>(color1: T, color2: T, fields: K[], amount=0.5) {
//   const results = fields.map((k: any) => {
//     return color1[k] * amount + color2[k] * (1 - amount)
//   })
//   return results
// }

export function mixRgb(color1: RGBColor, color2: RGBColor, amount=0.5) {
  // return rgb.apply(null, mixColorFieldss(color1, color2, ['r', 'g', 'b'], amount))
  const restAmount = 1 - amount
  const r = color1.r * amount + color2.r * (1 - amount)
  const g = color1.g * amount + color2.g * (1 - amount)
  const b = color1.b * amount + color2.b * (1 - amount)
  return rgb(r, g, b)
}