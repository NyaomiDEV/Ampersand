pkgname=ampersand-git
pkgver=0.1.9
pkgrel=1
pkgdesc="Tracking app for plural systems"
url="https://codeberg.org/NyaomiDEV/Ampersand"
license=("AGPL-v3.0-only")

arch=('x86_64' 'aarch64')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup' 'pango' 'webkit2gtk-4.1')
makedepends=('git' 'openssl' 'libappindicator-gtk3' 'librsvg' 'cargo' 'nodejs' 'jq')
source=("${pkgname}::git+${url}.git")
sha256sums=('SKIP')
options=(!lto)

pkgver() {
  cd "${srcdir}/${pkgname}"
  node upgrade-vcs.mjs >/dev/null 2>/dev/null
  jq -j .version package.json
}

build() {
  cd "${srcdir}/${pkgname}"
  yarn install
  yarn tauri build -b deb
}

package() {
  cp -a "${srcdir}/${pkgname}/src-tauri/target/release/bundle/deb/"Ampersand_*/data/* "${pkgdir}"
}
