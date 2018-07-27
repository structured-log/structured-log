/**
 * Represents a message template that can be rendered into a log message.
 */
export declare class MessageTemplate {
    /**
     * Gets or sets the raw message template of this instance.
     */
    raw: string;
    private tokens;
    /**
     * Creates a new MessageTemplate instance with the given template.
     */
    constructor(messageTemplate: string);
    /**
     * Renders this template using the given properties.
     * @param {Object} properties Object containing the properties.
     * @returns Rendered message.
     */
    render(properties?: Object): string;
    /**
     * Binds the given set of args to their matching tokens.
     * @param {any} positionalArgs Arguments.
     * @returns Object containing the properties.
     */
    bindProperties(positionalArgs: any): Object;
    private tokenize(template);
    private toText(property);
    private capture(property, destructure?);
}
