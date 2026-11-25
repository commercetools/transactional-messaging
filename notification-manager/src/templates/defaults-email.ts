// Starting points for new email templates, one per notification. Picking a notification in the template form
// fills the editor with its design; nothing here is sent or stored until a template is saved.
// The header and footer are repeated in each design so that every default works on its own. To share them,
// create them as parts and replace the copies with <mj-include path="<key>.mjml" />.
// Variables: {{messages.*}} come from Localizations, the rest from the notification (see the variable picker).
// Fonts are system fonts, so opening an email loads nothing from a third party.
import type { NotificationKey } from '../shared/notifications/keys';

const customerRegistration = `<mjml>
    <mj-head>
    <mj-attributes>
        <mj-text font-family="Helvetica, Arial, sans-serif" color="#000000" line-height="1.5" font-size="15px" font-weight="400" />
        <mj-button background-color="#1a1a1a" color="#ffffff"  font-family="Helvetica, Arial, sans-serif"  font-size="14px" border-radius="2px" padding="10px 24px" align="left"/>
        <mj-table font-family="Helvetica, Arial, sans-serif"/>
        <mj-class name="secondary" color="#565959" display="block" />
    </mj-attributes>
    <mj-style inline="inline">
        body {
            background-color: #ebebeb
        }

        .bold {
            font-weight:bold;
        }

        .secondary {
            color: #565959;
            display: block;
        }

        .custom-section {
            background-color: #FFFFFF
        }

        .divider {
            background-color: #ebebeb
        }

        .heroMessage {
            background-color: #f7f2ea;
        }

        a {
            text-decoration: underline; color: #000000;
        }
    </mj-style>
</mj-head>
    <mj-body width="600px">
        <mj-section css-class="custom-section">

    {{#if messages.heroImage}}
    <mj-column>
        <mj-image align="left"
                  src="{{messages.heroImage}}"/>
    </mj-column>
    {{/if}}
    <mj-column>
<!--        <mj-text font-size="26px">-->
<!--            {{heroMessage}}-->
<!--        </mj-text>-->
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section full-width="full-width" css-class="heroMessage">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.heroMessage}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.welcome}} {{customerFirstName}},
        </mj-text>
        <mj-text>
            {{messages.text}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column width="100%">
        <mj-text font-size="18px" font-weight="bold">
            {{messages.verificationText}}
        </mj-text>
        <mj-button href="{{messages.verificationLink}}">{{messages.verificationButtonText}}</mj-button>
        <mj-text>{{messages.verificationValidityText}}</mj-text>
    </mj-column>
</mj-section>
        <mj-section>
    <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
            <mj-social-element name="facebook" href="https://mjml.io/">
                Facebook
            </mj-social-element>
            <mj-social-element name="google" href="https://mjml.io/">
                Google
            </mj-social-element>
            <mj-social-element name="twitter" href="https://mjml.io/">
                Twitter
            </mj-social-element>
            <mj-social-element name="x" href="https://mjml.io/">
                X
            </mj-social-element>
        </mj-social>
    </mj-column>
</mj-section>
    </mj-body>
</mjml>
`;

const customerPasswordReset = `<mjml>
    <mj-head>
    <mj-attributes>
        <mj-text font-family="Helvetica, Arial, sans-serif" color="#000000" line-height="1.5" font-size="15px" font-weight="400" />
        <mj-button background-color="#1a1a1a" color="#ffffff"  font-family="Helvetica, Arial, sans-serif"  font-size="14px" border-radius="2px" padding="10px 24px" align="left"/>
        <mj-table font-family="Helvetica, Arial, sans-serif"/>
        <mj-class name="secondary" color="#565959" display="block" />
    </mj-attributes>
    <mj-style inline="inline">
        body {
            background-color: #ebebeb
        }

        .bold {
            font-weight:bold;
        }

        .secondary {
            color: #565959;
            display: block;
        }

        .custom-section {
            background-color: #FFFFFF
        }

        .divider {
            background-color: #ebebeb
        }

        .heroMessage {
            background-color: #f7f2ea;
        }

        a {
            text-decoration: underline; color: #000000;
        }
    </mj-style>
</mj-head>
    <mj-body width="600px">
        <mj-section css-class="custom-section">

    {{#if messages.heroImage}}
    <mj-column>
        <mj-image align="left"
                  src="{{messages.heroImage}}"/>
    </mj-column>
    {{/if}}
    <mj-column>
<!--        <mj-text font-size="26px">-->
<!--            {{heroMessage}}-->
<!--        </mj-text>-->
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section full-width="full-width" css-class="heroMessage">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.heroMessage}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.welcome}} {{customerFirstName}},
        </mj-text>
        <mj-text>
            {{messages.text}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column width="100%">
        <mj-text font-size="18px" font-weight="bold">
            {{messages.verificationText}}
        </mj-text>
        <mj-button href="{{messages.verificationLink}}">{{messages.verificationButtonText}}</mj-button>
        <mj-text>{{messages.verificationValidityText}}</mj-text>
    </mj-column>
</mj-section>
        <mj-section>
    <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
            <mj-social-element name="facebook" href="https://mjml.io/">
                Facebook
            </mj-social-element>
            <mj-social-element name="google" href="https://mjml.io/">
                Google
            </mj-social-element>
            <mj-social-element name="twitter" href="https://mjml.io/">
                Twitter
            </mj-social-element>
            <mj-social-element name="x" href="https://mjml.io/">
                X
            </mj-social-element>
        </mj-social>
    </mj-column>
</mj-section>
    </mj-body>
</mjml>
`;

const orderConfirmation = `<mjml>
    <mj-head>
    <mj-attributes>
        <mj-text font-family="Helvetica, Arial, sans-serif" color="#000000" line-height="1.5" font-size="15px" font-weight="400" />
        <mj-button background-color="#1a1a1a" color="#ffffff"  font-family="Helvetica, Arial, sans-serif"  font-size="14px" border-radius="2px" padding="10px 24px" align="left"/>
        <mj-table font-family="Helvetica, Arial, sans-serif"/>
        <mj-class name="secondary" color="#565959" display="block" />
    </mj-attributes>
    <mj-style inline="inline">
        body {
            background-color: #ebebeb
        }

        .bold {
            font-weight:bold;
        }

        .secondary {
            color: #565959;
            display: block;
        }

        .custom-section {
            background-color: #FFFFFF
        }

        .divider {
            background-color: #ebebeb
        }

        .heroMessage {
            background-color: #f7f2ea;
        }

        a {
            text-decoration: underline; color: #000000;
        }
    </mj-style>
</mj-head>
    <mj-body width="600px" >
        <mj-section css-class="custom-section">

    {{#if messages.heroImage}}
    <mj-column>
        <mj-image align="left"
                  src="{{messages.heroImage}}"/>
    </mj-column>
    {{/if}}
    <mj-column>
<!--        <mj-text font-size="26px">-->
<!--            {{heroMessage}}-->
<!--        </mj-text>-->
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section full-width="full-width" css-class="heroMessage">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.heroMessage}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.welcome}}
        </mj-text>
        <mj-text>
            {{messages.text}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column width="100%">
        <mj-text font-size="18px" font-weight="bold">
            {{messages.shippingConfirmation}}
        </mj-text>
        <mj-text>
            <span class="secondary">
                {{messages.delivery}}
            </span>
            <span class="bold">{{messages.deliveryDate}}</span>
        </mj-text>
        <mj-text>
            <span class="secondary">
                {{messages.deliveryTo}}
            </span>
            <span class="bold">{{shippingAddress.firstName}} {{shippingAddress.lastName}}
                <br/>
                {{shippingAddress.streetName}} {{shippingAddress.streetNumber}}
                <br/>
                {{shippingAddress.postalCode}} {{shippingAddress.city}}
                <br/>
                {{shippingAddress.country}}
            </span>
        </mj-text>
        <mj-text>
            <span class="secondary">
                {{messages.orderNumberText}}
            </span>
            <a href="{{messages.orderNumberLink}}" class="bold">{{orderNumber}}</a>
        </mj-text>
        <mj-button href="{{messages.orderTrackingLink}}">{{messages.trackOrder}}</mj-button>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="18px" font-weight="bold">
            {{messages.orderSummary}}
        </mj-text>
        <mj-raw>
            {{#each orderLineItems}}
        </mj-raw>
        <mj-table>
            <tr>
                <td style="background-image: linear-gradient(rgba(15, 17, 17, 0.03), rgba(15, 17, 17, 0.03));
    border-radius: 4px;
    display: table-cell;
    width: 131px;
    height: 131px;">
                    <a href="{{messages.orderNumberLink}}">
                        <img src="{{this.productImage}}" alt="{{this.productName}}"
                             style="max-height: 115px; max-width: 115px; display: block; padding: 8px; mix-blend-mode: multiply; ">
                    </a>
                </td>
                <td style="width: 8px;"/>
                <td style="vertical-align: middle;">
                    <p style="margin: 0;">
                        <span>
                            <a href="{{messages.orderNumberLink}}" style="text-decoration:none; color: #000000">
                                <span style="font-size: 15px;">{{this.productName}}</span>
                            </a>
                        </span>
                    </p>
                    <p style="margin: 4px 0 0 0; ">
                        <span class="secondary">
                            {{../messages.soldBy}}: commercetools
                        </span>
                    </p>
                    <p style="margin: 4px 0 0 0; ">
                        <span class="secondary">
                            {{../messages.amount}}: {{this.productQuantity}}
                        </span>
                    </p>
                    <p style="margin: 4px 0 0 0; ">
                        <span class="secondary" style="font-size: 15px;">
                            {{this.productSubTotal}}
                        </span>
                    </p>
                </td>
            </tr>
        </mj-table>
        <mj-raw>
            {{/each}}
        </mj-raw>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column width="50%">
        <mj-text mj-class="secondary">
            {{messages.totalAmount}}
        </mj-text>
    </mj-column>
    <mj-column width="50%">
        <mj-text align="right">{{orderTotalPrice}}</mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section>
    <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
            <mj-social-element name="facebook" href="https://mjml.io/">
                Facebook
            </mj-social-element>
            <mj-social-element name="google" href="https://mjml.io/">
                Google
            </mj-social-element>
            <mj-social-element name="twitter" href="https://mjml.io/">
                Twitter
            </mj-social-element>
            <mj-social-element name="x" href="https://mjml.io/">
                X
            </mj-social-element>
        </mj-social>
    </mj-column>
</mj-section>
    </mj-body>
</mjml>
`;

const orderStateChange = `<mjml>
    <mj-head>
    <mj-attributes>
        <mj-text font-family="Helvetica, Arial, sans-serif" color="#000000" line-height="1.5" font-size="15px" font-weight="400" />
        <mj-button background-color="#1a1a1a" color="#ffffff"  font-family="Helvetica, Arial, sans-serif"  font-size="14px" border-radius="2px" padding="10px 24px" align="left"/>
        <mj-table font-family="Helvetica, Arial, sans-serif"/>
        <mj-class name="secondary" color="#565959" display="block" />
    </mj-attributes>
    <mj-style inline="inline">
        body {
            background-color: #ebebeb
        }

        .bold {
            font-weight:bold;
        }

        .secondary {
            color: #565959;
            display: block;
        }

        .custom-section {
            background-color: #FFFFFF
        }

        .divider {
            background-color: #ebebeb
        }

        .heroMessage {
            background-color: #f7f2ea;
        }

        a {
            text-decoration: underline; color: #000000;
        }
    </mj-style>
</mj-head>
    <mj-body width="600px" >
        <mj-section css-class="custom-section">

    {{#if messages.heroImage}}
    <mj-column>
        <mj-image align="left"
                  src="{{messages.heroImage}}"/>
    </mj-column>
    {{/if}}
    <mj-column>
<!--        <mj-text font-size="26px">-->
<!--            {{heroMessage}}-->
<!--        </mj-text>-->
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section full-width="full-width" css-class="heroMessage">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.heroMessage}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.welcome}}
        </mj-text>
        <mj-text>
            {{messages.text}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text>
            {{#if oldOrderState}}{{oldOrderState}} {{/if}}{{messages.to}} {{orderState}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section>
    <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
            <mj-social-element name="facebook" href="https://mjml.io/">
                Facebook
            </mj-social-element>
            <mj-social-element name="google" href="https://mjml.io/">
                Google
            </mj-social-element>
            <mj-social-element name="twitter" href="https://mjml.io/">
                Twitter
            </mj-social-element>
            <mj-social-element name="x" href="https://mjml.io/">
                X
            </mj-social-element>
        </mj-social>
    </mj-column>
</mj-section>
    </mj-body>
</mjml>
`;

const shipmentStateChange = `<mjml>
    <mj-head>
    <mj-attributes>
        <mj-text font-family="Helvetica, Arial, sans-serif" color="#000000" line-height="1.5" font-size="15px" font-weight="400" />
        <mj-button background-color="#1a1a1a" color="#ffffff"  font-family="Helvetica, Arial, sans-serif"  font-size="14px" border-radius="2px" padding="10px 24px" align="left"/>
        <mj-table font-family="Helvetica, Arial, sans-serif"/>
        <mj-class name="secondary" color="#565959" display="block" />
    </mj-attributes>
    <mj-style inline="inline">
        body {
            background-color: #ebebeb
        }

        .bold {
            font-weight:bold;
        }

        .secondary {
            color: #565959;
            display: block;
        }

        .custom-section {
            background-color: #FFFFFF
        }

        .divider {
            background-color: #ebebeb
        }

        .heroMessage {
            background-color: #f7f2ea;
        }

        a {
            text-decoration: underline; color: #000000;
        }
    </mj-style>
</mj-head>
    <mj-body width="600px" >
        <mj-section css-class="custom-section">

    {{#if messages.heroImage}}
    <mj-column>
        <mj-image align="left"
                  src="{{messages.heroImage}}"/>
    </mj-column>
    {{/if}}
    <mj-column>
<!--        <mj-text font-size="26px">-->
<!--            {{heroMessage}}-->
<!--        </mj-text>-->
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section full-width="full-width" css-class="heroMessage">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.heroMessage}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.welcome}}
        </mj-text>
        <mj-text>
            {{messages.text}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text>
            {{#if oldShipmentState}}{{oldShipmentState}} {{/if}}{{messages.to}} {{shipmentState}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section>
    <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
            <mj-social-element name="facebook" href="https://mjml.io/">
                Facebook
            </mj-social-element>
            <mj-social-element name="google" href="https://mjml.io/">
                Google
            </mj-social-element>
            <mj-social-element name="twitter" href="https://mjml.io/">
                Twitter
            </mj-social-element>
            <mj-social-element name="x" href="https://mjml.io/">
                X
            </mj-social-element>
        </mj-social>
    </mj-column>
</mj-section>
    </mj-body>
</mjml>
`;

const orderRefund = `<mjml>
    <mj-head>
    <mj-attributes>
        <mj-text font-family="Helvetica, Arial, sans-serif" color="#000000" line-height="1.5" font-size="15px" font-weight="400" />
        <mj-button background-color="#1a1a1a" color="#ffffff"  font-family="Helvetica, Arial, sans-serif"  font-size="14px" border-radius="2px" padding="10px 24px" align="left"/>
        <mj-table font-family="Helvetica, Arial, sans-serif"/>
        <mj-class name="secondary" color="#565959" display="block" />
    </mj-attributes>
    <mj-style inline="inline">
        body {
            background-color: #ebebeb
        }

        .bold {
            font-weight:bold;
        }

        .secondary {
            color: #565959;
            display: block;
        }

        .custom-section {
            background-color: #FFFFFF
        }

        .divider {
            background-color: #ebebeb
        }

        .heroMessage {
            background-color: #f7f2ea;
        }

        a {
            text-decoration: underline; color: #000000;
        }
    </mj-style>
</mj-head>
    <mj-body width="600px" >
        <mj-section css-class="custom-section">

    {{#if messages.heroImage}}
    <mj-column>
        <mj-image align="left"
                  src="{{messages.heroImage}}"/>
    </mj-column>
    {{/if}}
    <mj-column>
<!--        <mj-text font-size="26px">-->
<!--            {{heroMessage}}-->
<!--        </mj-text>-->
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section full-width="full-width" css-class="heroMessage">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.heroMessage}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section css-class="custom-section">
    <mj-column>
        <mj-text font-size="26px" >
            {{messages.welcome}}
        </mj-text>
        <mj-text>
            {{messages.text}}
        </mj-text>
    </mj-column>
</mj-section>
        <mj-section css-class="divider" padding="0" padding-bottom="5px">

</mj-section>
        <mj-section>
    <mj-column>
        <mj-social font-size="15px" icon-size="30px" mode="horizontal">
            <mj-social-element name="facebook" href="https://mjml.io/">
                Facebook
            </mj-social-element>
            <mj-social-element name="google" href="https://mjml.io/">
                Google
            </mj-social-element>
            <mj-social-element name="twitter" href="https://mjml.io/">
                Twitter
            </mj-social-element>
            <mj-social-element name="x" href="https://mjml.io/">
                X
            </mj-social-element>
        </mj-social>
    </mj-column>
</mj-section>
    </mj-body>
</mjml>
`;

export const DEFAULT_EMAIL_MJML: Record<NotificationKey, string> = {
  'customer-registration': customerRegistration,
  'customer-password-reset': customerPasswordReset,
  'order-confirmation': orderConfirmation,
  'order-state-change': orderStateChange,
  'shipment-state-change': shipmentStateChange,
  'order-refund': orderRefund,
};
