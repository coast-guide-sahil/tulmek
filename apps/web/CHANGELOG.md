# Changelog

## [1.0.0](https://github.com/coast-guide-sahil/tulmek/compare/web-v0.4.0...web-v1.0.0) (2026-03-26)


### ⚠ BREAKING CHANGES

* remove all authentication, database, and email infrastructure

### Features

* add progress tracker with 690 trackable items ([2b0b3b7](https://github.com/coast-guide-sahil/tulmek/commit/2b0b3b77e90de0a1cac19569b6885556bae5109f))
* add progress tracker with 690 trackable items ([566066f](https://github.com/coast-guide-sahil/tulmek/commit/566066fc15444a372a77577daace35b9bd8ab71e))
* redirect homepage to progress tracker ([29ebe49](https://github.com/coast-guide-sahil/tulmek/commit/29ebe497d3b61ec4ba42a32797a96b0b406f13a8))


### Bug Fixes

* add html reporter in CI so playwright-report artifact uploads ([8e848a4](https://github.com/coast-guide-sahil/tulmek/commit/8e848a4fbc22e78cc6f5a82080303ee15f65c51a))
* address all remaining review findings (17/17 issues) ([6660c60](https://github.com/coast-guide-sahil/tulmek/commit/6660c6017fccef2dcc5214ac7b4f26c8317c9326))
* address critical review findings across security, architecture, QA, a11y ([0fcd20f](https://github.com/coast-guide-sahil/tulmek/commit/0fcd20fcb62c8988fe4298ff876886081b337b55))
* remove all third-party product references from code ([8b48d71](https://github.com/coast-guide-sahil/tulmek/commit/8b48d71e9b719f414e330d51e4311307c8da699d))
* resolve all CI lint warnings ([e36891a](https://github.com/coast-guide-sahil/tulmek/commit/e36891af4440000c53f94c644abc4347c7e22339))
* update docs with testing commands and fix sign-up E2E selector ([#35](https://github.com/coast-guide-sahil/tulmek/issues/35)) ([774547f](https://github.com/coast-guide-sahil/tulmek/commit/774547f7e0c55514d2f5bac3a44cb0c0d423d871))


### Code Refactoring

* remove all authentication, database, and email infrastructure ([2910ef6](https://github.com/coast-guide-sahil/tulmek/commit/2910ef696ee507626afa100ee84866503f41ecda))

## [0.4.0](https://github.com/coast-guide-sahil/tulmek/compare/web-v0.3.0...web-v0.4.0) (2026-03-25)


### Features

* verify email via OTP before signup instead of after ([#27](https://github.com/coast-guide-sahil/tulmek/issues/27)) ([3f3a980](https://github.com/coast-guide-sahil/tulmek/commit/3f3a98076163a76047ca3dd3ca6ae02f49887592))


### Bug Fixes

* handle Resend API errors instead of silently swallowing them ([#29](https://github.com/coast-guide-sahil/tulmek/issues/29)) ([c4e6691](https://github.com/coast-guide-sahil/tulmek/commit/c4e6691708a7a5165f4e974573d109965b99fdf6))
* harden pre-signup OTP flow against brute-force attacks ([#30](https://github.com/coast-guide-sahil/tulmek/issues/30)) ([55f9c84](https://github.com/coast-guide-sahil/tulmek/commit/55f9c845615065a60ae95bcfb5f400bfbeb76640))
* redirect to verify-email when sign-up returns null token ([#24](https://github.com/coast-guide-sahil/tulmek/issues/24)) ([9cadfc1](https://github.com/coast-guide-sahil/tulmek/commit/9cadfc10cb55c83ae40bc73ab25ae35797dd27e2))
* use connection() to ensure sign-up page reads env at runtime ([#28](https://github.com/coast-guide-sahil/tulmek/issues/28)) ([fc322ce](https://github.com/coast-guide-sahil/tulmek/commit/fc322ce29b00aaa011d7296335b1785af108f376))

## [0.3.0](https://github.com/coast-guide-sahil/tulmek/compare/web-v0.2.0...web-v0.3.0) (2026-03-24)


### Features

* add email OTP verification for new signups ([#22](https://github.com/coast-guide-sahil/tulmek/issues/22)) ([f5a2b7c](https://github.com/coast-guide-sahil/tulmek/commit/f5a2b7ca4b5d6e383710266b64429db75e6f8b01))

## [0.2.0](https://github.com/coast-guide-sahil/tulmek/compare/web-v0.1.2...web-v0.2.0) (2026-03-24)


### Features

* add db:promote-admin CLI for bootstrapping admin users ([#20](https://github.com/coast-guide-sahil/tulmek/issues/20)) ([f4931e4](https://github.com/coast-guide-sahil/tulmek/commit/f4931e49badac8e09aba683c98340cbfefe4cc18))

## [0.1.2](https://github.com/coast-guide-sahil/tulmek/compare/web-v0.1.1...web-v0.1.2) (2026-03-24)


### Bug Fixes

* downgrade eslint to v9 for eslint-config-next 16.2.1 compatibility ([#18](https://github.com/coast-guide-sahil/tulmek/issues/18)) ([8976539](https://github.com/coast-guide-sahil/tulmek/commit/89765390e03a8773df553e86916ca10841dadacc))

## [0.1.1](https://github.com/coast-guide-sahil/tulmek/compare/web-v0.1.0...web-v0.1.1) (2026-03-24)


### Bug Fixes

* address QA, security, and PR review findings ([554944a](https://github.com/coast-guide-sahil/tulmek/commit/554944a4b76e062e2f844a034bdc4deaf96e8ee3))
* docker best practices - tini, cache mounts, node healthcheck, cap_drop ([7518bbe](https://github.com/coast-guide-sahil/tulmek/commit/7518bbe502d73a7dc8d5ecbfb17c2fa840185311))
* docker build - set PNPM_HOME for global turbo install, add root .dockerignore ([db9a7f3](https://github.com/coast-guide-sahil/tulmek/commit/db9a7f38688fd26bc6ea7e9131f8b859f2e36233))
