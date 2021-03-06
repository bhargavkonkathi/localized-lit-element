import { LitElement } from '@polymer/lit-element';
import { MessageContext, ftl } from 'fluent';

export { html } from '@polymer/lit-element';
export { ftl } from 'fluent';

/**
 * A LitElement extension that provides easy l10n out of the box.
 * @class
 * @extends LitElement
 */
export class LocalizedLitElement extends LitElement {
  /**
   * Gets the global locale
   * @return {string} The current global locale
   */
  get globalLocale() {
    return LitElement.globalLocale;
  }

  /**
   * Sets the global locale
   * @param {string} locale The locale to set as global
   */
  set globalLocale(locale) {
    LitElement.globalLocale = locale;
  }

  /**
   * The LocalizedLitElement constructor.
   * Besides calling the super constructor, it also
   * instantiates the global and local l10n cache.
   * @constructor
   */
  constructor() {
    super();
    // Global requests cache, shared between every element
    // that extends LocalizedLitElement
    if (!LocalizedLitElement.__localizationCache) {
      LocalizedLitElement.__localizationCache = {};
    }
    // Local contexts, shared only between instances of the same element
    if (!this.constructor.prototype.__contexts) {
      this.constructor.prototype.__contexts = {};
    }
  }

  /**
   * Gets the context for the given locale.
   * If the context for the locale does not exists, a new context
   * is created and associated with the locale.
   * If no locale is provided, the current locale will be used.
   * If no current locale is set, the global locale will be used.
   * If no locale is available at all, an error will be thrown.
   * @param {string} [locale] The locale to get the context of
   * @return {MessageContext} The context of the given locale
   */
  getLocaleContext(locale) {
    const loc = locale || this.locale || this.globalLocale;
    if (!loc) {
      throw new Error('No locale provided');
    }
    const contexts = this.constructor.prototype.__contexts;
    if (!contexts[loc]) {
      contexts[loc] = new MessageContext(loc);
    }
    return contexts[loc];
  }

  /**
   * Adds the given fluent template resource to the given locale context
   * @param {string} fluentTemplate The fluent template resource to add to the
   *        locale context
   * @param {string} [locale] The locale to add the fluent template resource to
   * @return {MessageContext} The locale context with the new fluent template
   *         resource added
   */
  addResourceForLocale(fluentTemplate, locale) {
    const ctx = this.getLocaleContext(locale);
    ctx.addMessages(fluentTemplate);
    return ctx;
  }

  /**
   * Loads the FTL resource at the given path for the given locale.
   * @param {String} path The path to fetch the FTL resource from
   * @param {String} [locale] The locale to associate the fetched resource with
   * @return {Promise<MessageContext>} A promise that resolves to the
   *         MessageContext with the fetched messages already added
   */
  loadResourceForLocale(path, locale) {
    const cache = LocalizedLitElement.__localizationCache;
    if (!cache[path]) {
      cache[path] = fetch(path)
        .then((res) => res.text())
        .then((localeFile) => ftl([localeFile]));
    }
    return cache[path].then((fluentTemplate) =>
      this.addResourceForLocale(fluentTemplate, locale));
  }

  /**
   * Localizes a string based on the current language context.
   * @param {string} key The key to get the localization of.
   * @param {*} [params] The params to pass to the localization string.
   * @param {string} [locale] The locale of the message. Use this param
   *        to override the current language
   * @return {string | undefined} The localized string corresponding to the
   *         given key and with the given params (if it exists)
   */
  localize(key, params, locale) {
    const ctx = this.getLocaleContext(locale);
    const message = ctx.getMessage(key);
    if (!message) {
      return;
    }
    return ctx.format(message, params);
  }
}
