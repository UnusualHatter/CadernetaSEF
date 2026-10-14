import { PROJECT } from '../data.js';
import { logo, toast } from '../ui.js';
import { navigate } from '../router.js';
import { store } from '../store.js';
import { esc } from '../util.js';

export default function login() {
    return {
        html: `<div class="login">
            <div class="login-brand rise">
                ${logo()}
                <span class="brand-kicker">${PROJECT.kicker}</span>
                <h1>${PROJECT.name}</h1>
                <p>${PROJECT.title} do projeto de extensão da Feevale</p>
            </div>

            <form class="card form rise" id="login-form" novalidate>
                <div class="field">
                    <label for="email">E-mail</label>
                    <input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="username" value="admin@agenda.local" required>
                </div>
                <div class="field">
                    <label for="password">Senha</label>
                    <input class="input" id="password" name="password" type="password" autocomplete="current-password" value="password" required>
                </div>
                <p class="error-text" id="login-error" role="alert" hidden></p>
                <button class="btn btn-primary btn-block" type="submit">Entrar</button>
                <button class="link small" type="button" id="forgot">Esqueci minha senha</button>
            </form>

            <p class="demo-note rise">Versão de demonstração: os dados são fictícios e ficam salvos só neste aparelho. O login já vem preenchido.</p>

            <p class="login-foot">Projeto de extensão do curso de Ciências Contábeis<br>Universidade Feevale · ${esc(PROJECT.coordinator)}</p>
        </div>`,

        mount(root) {
            const form = root.querySelector('#login-form');
            const error = root.querySelector('#login-error');

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const user = store.login(form.email.value, form.password.value);

                if (!user) {
                    error.textContent = 'E-mail ou senha incorretos. Confira os dados e tente de novo.';
                    error.hidden = false;
                    return;
                }
                navigate('/');
            });

            root.querySelector('#forgot').addEventListener('click', () =>
                toast('Na versão com servidor, enviaremos um e-mail para você criar uma nova senha.'),
            );
        },
    };
}
