var URL = 'https://coraglio-mp-commerce-nodejs.herokuapp.com';
var express = require('express');
var exphbs = require('express-handlebars');
// SDK de Mercado Pago
const mercadopago = require('mercadopago');
// Agrega credenciales
mercadopago.configure({
    access_token: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398'
});

var payer = {
    name: "Lalo",
    surname: "Landa",
    email: "test_user_63274575@testuser.com",
    identification: {
        type: 'DNI',
        number: '22.333.44'
    },
    phone: {
        area_code: "011",
        number: 22223333
    },

    address: {
        street_name: "Falsa",
        street_number: 123,
        zip_code: "1111"
    }
}

var app = express();
app.set('port', process.env.PORT || 3000);

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res, next) {
    let img_path = req.query.img.split('/');

    // Crea un objeto de preferencia
    let preference = {
        external_reference: 'ABCD1234',
        items: [
            {
                id: 1234,
                title: req.query.title,
                unit_price: parseFloat(req.query.price),
                picture_url: URL + '/' + img_path[1] + '/' + img_path[2],
                quantity: 1,
                description: 'Dispositivo móvil de Tienda e-commerce',
                currency_id: 'ARS',
            }
        ],
        payer: payer,
        payment_methods: {
            excluded_payment_methods: [
                { id: 'amex' },
            ],
            excluded_payment_types: [
                {
                    "id": "atm"
                }
            ],
            installments: 6
        },
        back_urls: {
            success: URL + "/success",
            failure: URL + "/failure",
            pending: URL + "/pending"
        },
        auto_return: "approved",
        notification_url: URL + '/ipn',
    };

    mercadopago.preferences.create(preference)
        .then(function (response) {
            // Este valor reemplazará el string "$$init_point$$" en tu HTML
            req.query.init_point = response.body.init_point;

            res.render('detail', req.query);
        }).catch(function (error) {
            console.log(error);
            res.status(500).send();
        });

    // next()
});

app.get('/failure', function (req, res) {
    res.send('El pago fue rechazado')
});

app.get('/pending', function (req, res) {
    res.send('El pago está pendiente')
});

app.get('/success', function (req, res) {
    mercadopago.payment.get(req.query.collection_id).then(function (mp) {
        res.send('El pago fue exitoso<br>' +
            `payment_method_id: ${mp.body.payment_method_id}<br>` +
            `transaction_amount: ${mp.body.transaction_amount}<br>` +
            `order: ${mp.body.order.id}<br>` +
            `id: ${mp.body.id}<br>`)
    }).catch(function (error) {
        console.log(error);
        res.status(500).send();
    });
});

app.post('/ipn', function (req, res) {
    console.log(req.query);
    res.status(200).send();
});

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.listen(app.get('port'));