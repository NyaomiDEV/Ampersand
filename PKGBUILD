pkgname=ampersand-git
pkgver=0.3.1_rc1
pkgrel=1
pkgdesc="Tracking app for people with complex dissociative disorders"
url="https://codeberg.org/Ampersand/app"
license=("AGPL-v3.0-only")

arch=('x86_64' 'aarch64')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup3' 'pango' 'webkit2gtk-4.1')
makedepends=('git' 'openssl' 'libappindicator-gtk3' 'librsvg' 'cargo' 'nodejs' 'jq')
source=("${pkgname}::git+${url}.git")
sha256sums=('SKIP')
options=(!lto)

pkgver() {
  cd "${srcdir}/${pkgname}"
  # send the terminal outputs to null
  corepack pnpm install > /dev/null 2>/dev/null
  corepack pnpm run upgrade-vcs >/dev/null 2>/dev/null
  # strip terminal output of anything not allowed for pkgver
  jq -j .version package.json | sed 's/[^-]*-g/r&/;s/-/+/g'
}

build() {
  cd "${srcdir}/${pkgname}"
  corepack pnpm install
  corepack pnpm tauri build -b deb
}

package() {
  cp -a "${srcdir}/${pkgname}/src-tauri/target/release/bundle/deb/"Ampersand_*/data/* "${pkgdir}"
}
