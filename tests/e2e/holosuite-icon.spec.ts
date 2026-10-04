import {test, expect} from "@playwright/test";
import {readFileSync} from "node:fs";

// Core 1.0.12's relevant cascade: global icons plus a device-specific mask.
const coreStyle = process.env.HN_CORE_CSS ? readFileSync(process.env.HN_CORE_CSS, "utf8") : `
  .holosuite-app-tile {--hs-app-accent:#7fe5ee}
  .holosuite-app-icon,.holosuite-whats-new-icon {
    display:flex;position:relative;width:38px;height:38px;
    border:1px solid #7fe5ee;background:#05080b;overflow:hidden;
  }
  .holosuite-app-icon::before {
    content:"";display:block;background:currentColor;width:23px;height:23px;
    mask:linear-gradient(black,black);position:relative;
  }
  .holosuite-app-icon::after {content:"";display:block;background:cyan;height:1px}
  .holosuite-app-icon i {display:none}
  :where(:root,body)[data-holosuite-device-style="space-police"] .holosuite-app-icon::before {
    background:currentColor;display:block;mask:linear-gradient(black,black);
  }
`;

for (const theme of ["base", "space-police"]) for (const coreFirst of [true, false]) {
  test(`Prisma launcher logo survives Core ${theme}, loaded first=${coreFirst}`, async ({page}) => {
    await page.goto("/tests/fixtures/foundry-runtime.html");
    const core = `<style>${coreStyle}</style>`;
    // Foundry loads ordinary module CSS into this layer.
    const module = '<style>@layer modules;@import url("/dist/style.css") layer(modules);</style>';
    const body = `<body data-holosuite-device-style="${theme}"><div class="holosuite-phone">
      <button class="holosuite-app-tile" data-holosuite-app="holosuite-news">
        <span class="holosuite-app-icon" data-holosuite-app-icon="holosuite-news"><i class="hn-prisma-app-glyph"></i></span>HoloNews
      </button>
      <span class="holosuite-whats-new-icon" data-holosuite-app-icon="holosuite-news"><i class="hn-prisma-app-glyph"></i></span>
      <span class="holosuite-app-icon" data-holosuite-app-icon="other"><i></i></span>
      </div></body>`;
    const otherState = () => page.locator('[data-holosuite-app-icon="other"]').evaluate(element => {
      const style = getComputedStyle(element, "::before");
      return {image:style.backgroundImage, mask:style.maskImage, width:style.width};
    });
    await page.setContent(`<html><head>${core}</head>${body}</html>`, {waitUntil:"networkidle"});
    const baseline = await otherState();
    await page.setContent(`<html><head>${coreFirst ? core + module : module + core}</head>${body}</html>`, {waitUntil:"networkidle"});
    for (const selector of [".holosuite-app-icon", ".holosuite-whats-new-icon"]) {
      const state = await page.locator(`${selector}[data-holosuite-app-icon="holosuite-news"]`).evaluate(element => {
        const icon = getComputedStyle(element, "::before");
        return {image:icon.backgroundImage, mask:icon.maskImage, display:icon.display,
          width:icon.width, fallback:getComputedStyle(element.querySelector("i")!).display,
          after:getComputedStyle(element, "::after").display};
      });
      expect(state.image).toContain("holonews-mark");
      expect(state).toMatchObject({mask:"none", display:"block", width:"38px", fallback:"none", after:"none"});
      const url = state.image.slice(5, -2);
      expect(await page.evaluate(src => new Promise<boolean>(resolve => {
        const image = new Image();
        image.onload = () => resolve(image.naturalWidth > 0);
        image.onerror = () => resolve(false);
        image.src = src;
      }), url)).toBe(true);
    }
    expect(await otherState()).toEqual(baseline);
    if (process.env.HN_CORE_CSS) await page.screenshot({path:`artifacts/holosuite-prisma-${theme}-${coreFirst}.png`});
  });
}
