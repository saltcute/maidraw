/**
 * Assets that a manifest is allowed to reference even though they do not exist on disk.
 *
 * {@link Theme.getFile} returns an empty buffer for a missing file rather than throwing, so an
 * unlisted broken reference renders as a blank sprite with no error anywhere. Generation therefore
 * fails on any reference that does not resolve, and every exception has to be justified here.
 *
 * Keys are paths relative to `assets/`.
 */
export const missingAssetAllowlist: Record<string, string> = {
    "themes/maimai/best50/finale/assets/achievement/bb.webp":
        "maimai FiNALE predates the DX rank set and has no B+/BB artwork. FiNALE is an unsupported bonus theme, so the rank falls back to a blank sprite.",
    "themes/maimai/best50/finale/assets/achievement/bbb.webp":
        "maimai FiNALE predates the DX rank set and has no BB+/BBB artwork. FiNALE is an unsupported bonus theme, so the rank falls back to a blank sprite.",
};
