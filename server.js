// BACKEND (server.js)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

const KIWIFY_PRODUCT_URL = "https://pay.kiwify.com.br/4730T4YjLuKTuKu";
const transactions = new Map();

app.use(cors());
app.use(bodyParser.json());

app.post('/api/start-checkout', (req, res) => {
    const { answers } = req.body;
    if (!answers || Object.keys(answers).length === 0) {
        return res.status(400).json({ message: 'Respostas inválidas.' });
    }
    const transactionId = uuidv4();
    transactions.set(transactionId, { status: 'PENDING', answers: answers });
    console.log(`[LOG] Transação criada: ${transactionId}`);
    res.status(200).json({ transactionId: transactionId, checkoutUrl: KIWIFY_PRODUCT_URL });
});

app.get('/api/check-payment/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) {
        return res.status(404).json({ message: 'Transação não encontrada.' });
    }
    res.status(200).json({ status: transaction.status });
});

app.post('/api/kiwify-webhook', (req, res) => {
    const kiwifyData = req.body;
    console.log('[LOG] Webhook recebido:', JSON.stringify(kiwifyData, null, 2));
    const orderStatus = kiwifyData.event;
    if (orderStatus === 'order.paid') {
        let transactionToUpdateId = null;
        for (const [id, data] of transactions.entries()) {
            if (data.status === 'PENDING') {
                transactionToUpdateId = id;
                break;
            }
        }
        if (transactionToUpdateId) {
            const transaction = transactions.get(transactionToUpdateId);
            if (transaction) {
                transaction.status = 'PAID';
                transactions.set(transactionToUpdateId, transaction);
                console.log(`[LOG] Transação PAGA via Webhook: ${transactionToUpdateId}`);
            }
        }
    }
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});