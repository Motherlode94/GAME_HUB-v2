# Shared RTS sprite library

The shared asset pack is organized under `/_shared/rts/assets/<Category>/<filename>.png` with 44 original images. Categories: `Infanterie`, `Vehicules`, `Aeriens`, `Armement`, `Structures`, `Ravitaillement`, `Effets`.

**Status:** The 44 PNG binary assets are not yet uploaded to GitHub. Upload the contents of `WarLike_GameHub_Bibliotheque_RTS_Partagee.zip` to the repository root before enabling paths in games.

Load `/_shared/rts/library.js` before game scripts. `WarLikeRTSAssets.draw(ctx, spriteId, x, y, width, height, angle)` returns `false` until an image has loaded or when missing; leave existing procedural rendering enabled as fallback. `WarLikeRTSAssets.preload(id)` returns an image or `null`. Do not delete existing sprite fallback logic.

Preserve the source sprites: some original files include dark backgrounds or overlapping elements which must be addressed explicitly before production gameplay.