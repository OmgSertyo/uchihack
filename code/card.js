function main() {
    // ----------------------------------------------------------------------------------
    // Ждем когда "__score" загрузится
    if (typeof Card === 'undefined' || typeof Card.Player === 'undefined'
        || typeof Card.Player.__score === 'undefined') {
        setTimeout(main, 50);
        return;
    }

    // ----------------------------------------------------------------------------------
    // Инитиальзация
    count = 0;
    isOld = false;
    let isSolving = false;

    // ----------------------------------------------------------------------------------
    // Проверка на старую карточку
    if (typeof Card.Player._emitSignal === 'undefined') {
        l_exinfo("\"Card.Player._emitSignal\" не найден, это старое задание");
        isOld = true;
    }

    // ----------------------------------------------------------------------------------
    // Отправить API реквест к "events"
    function send_event(a, b) {
        l_info("Отправляем API реквест к \"events\"...");
        console.group("Информация о реквесте");
        console.log("Событие: ", a);
        console.log("Данные: ", b);
        console.groupEnd();
        if (isOld) Card.Player.__score.tutor._sys_event(a, b); // Старый метод. Имеет большой минус,
        // он не может быть использован если
        // задание сломалось.
        else Card.Player._emitSignal(a, b); // Метод для новый заданий
    }

    // ----------------------------------------------------------------------------------
    // Пометить карточку решенной
    function report_solve() {
        l_info("Отправляем \"$lesson_finish\"...");
        send_event("$lesson_finish");
        reload_on_sent();
    }

    // ----------------------------------------------------------------------------------
    // Получить Score JSON
    function get_score_json() {
        l_info("Получаем Score JSON...");
        var n = {};
        Card.Player.__score.save(n); // Работает для старых и новых
        console.group("Score JSON");
        console.log("Data: ", n);
        console.groupEnd();
        return n;
    }

    // ----------------------------------------------------------------------------------
    // Solve current exercise
    function solve_current() {
        l_info("Решаем текущее задание...");
        // Черная магия
        if (Card.Player.__score.current + 1 <= Card.Player.__score.total) // Добавим один к "__score.current"
            Card.Player.__score.current++; // если "__score.total" дает нам
        // Ешё больше черной магии
        if (Card.Player.__score._index + 2 <= Card.Player.__score.total) // Добавим два к "__score._index"
            Card.Player.__score._index += 2; // если "__score.total" дает нам
        else Card.Player.__score._index--; // это сделать, если нет то вычитаем
        // Обозначить текущее задание решенным
        send_event("beads_exercise_finish_succ", {
            "amount": Card.Player.__score.current,
            "total": Card.Player.__score.total
        });
        // Отправляем текущий "__score"
        if (isOld) send_event("$store", get_score_json()); // Метод для старых заданий
        else send_event("$store", {                  // Метод для новых заданий,
            "json": JSON.stringify(get_score_json()) // только небольное отличие
        });
    }

    // ----------------------------------------------------------------------------------
    // Включить автоматическое решение
    function solve_all() {
        l_info("Автоматическое решение включено!");
        isSolving = true;
        sessionStorage.setItem('solverUrl', location.href);
        sessionStorage.setItem('doSolve', 'true');
        sessionStorage.removeItem('solved'); // Убираем флаг solved при запуске решения

        // Решаем все задания в карточке
        function solve_complete_card() {
            if (Card.Player.__score.current < Card.Player.__score.total) {
                solve_current();
                // Ждем завершения AJAX и решаем следующее задание
                l_success(Card.Player.__score.current);
                l_success(Card.Player.__score.total);
                setTimeout(solve_complete_card, 1000);
            } else if (Card.Player.__score.current => Card.Player.__score.total){
                // Все задания решены, завершаем карточку
                report_solve();
                sessionStorage.setItem('solved', 'true');
                isSolving = false;

                // Перенаправляем после полного решения
                setTimeout(() => {
                    l_success("Вся карточка решена! Перенаправляем...");
                    window.location.href = "https://uchi.ru/profile/students";
                }, 2000);
            }
        }

        solve_complete_card();
    }

    // ----------------------------------------------------------------------------------
    // Ждем пока AJAX реквест отправится
    function test_count() {
        if (count >= 1) {
            location.reload(false);
            return;
        }

        setTimeout(function () {
            test_count();
        }, 50);
    }

    // ----------------------------------------------------------------------------------
    // Перезагрузить страницу когда AJAX реквест отпарвится
    function reload_on_sent() {
        setTimeout(function () {
            test_count();
        }, 50);
        $(document).ajaxStop(function () {
            count++;
        });
    }

    // ----------------------------------------------------------------------------------
    // Статус
    color = "green";

    if (sessionStorage.getItem('doSolve') === 'true'
        && sessionStorage.getItem('solved') !== 'true'
        && sessionStorage.getItem('solverUrl') == location.href) {
        color = "orange";
        status = "Решаем";
    } else if (sessionStorage.getItem('solved') === 'true')
        status = "Решено";
    else if (isOld)
        status = "Поддержка старых заданий";
    else status = "Готов";

    // ----------------------------------------------------------------------------------
    // Запускаем решение всей карточки
    solve_all();
    // ----------------------------------------------------------------------------------

};

(() => {
    // ----------------------------------------------------------------------------------
    // Не загружаем UchiHack несколько раз
    if (typeof UchiHack !== 'undefined') return;

    UchiHack = {};
    UchiHack.type = "card";
    UchiHack.version = "v2.4.0";

    // Очищаем флаги автоматического решения при загрузке страницы
    sessionStorage.removeItem('doSolve');
    sessionStorage.removeItem('solved');
    sessionStorage.removeItem('solverUrl');

    l_exinfo(`Версия ${UchiHack.version} (Сделано TheAirBlow)`);
    main();
})();