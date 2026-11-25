import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Gift, installCommand } from './gifts';
import { type Ctx, words } from './shopfront';

const { colors } = theme;

/** The gift tag in front of the shop: the gift's name, what it does and how to take it home. */
export function giftTag(ctx: Ctx, { skill, name, does, wrap }: Gift) {
  shadow(ctx, 47, 91, 40);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(10.6, 77.6, 80, 19);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cream;
  ctx.fillRect(10, 77, 80, 19);
  ctx.fillStyle = wrap;
  ctx.fillRect(10, 77, 2.5, 19);
  ctx.fillStyle = colors.ink;
  words(ctx, name, 51, 81.5, 4.6, 72, 'bold');
  words(ctx, does, 51, 87, 3.3, 72);
  ctx.fillStyle = colors.pineDark;
  words(ctx, installCommand(skill), 51, 92.3, 2.8, 74);
}
