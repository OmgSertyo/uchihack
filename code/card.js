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
        if (isOld) Card.Player.__score.tutor._sys_event(a, b);
        else Card.Player._emitSignal(a, b);
    }

    // ----------------------------------------------------------------------------------
    // Пометить карточку решенной
    function report_solve() {
        l_info("Отправляем \"$lesson_finish\"...");
        send_event("$lesson_finish");
        l_success("Вся карточка решена! Перенаправляем...");
        window.location.href = "https://uchi.ru/profile/students";
    }

    // ----------------------------------------------------------------------------------
    // Получить Score JSON
    function get_score_json() {
        l_info("Получаем Score JSON...");
        var n = {};
        Card.Player.__score.save(n);
        console.group("Score JSON");
        console.log("Data: ", n);
        console.groupEnd();
        return n;
    }

    // ----------------------------------------------------------------------------------
    // Solve current exercise - УСКОРЕННАЯ ВЕРСИЯ
    function solve_current() {
        // СРАЗУ решаем все оставшиеся задания
        const remaining = Card.Player.__score.total - Card.Player.__score.current;

        if (remaining > 0) {
            l_info(`Решаем ${remaining} заданий сразу...`);

            // Мгновенно завершаем все задания
            Card.Player.__score.current = Card.Player.__score.total;
            Card.Player.__score._index = Card.Player.__score.total * 2;

            // Отправляем одно событие для всех заданий
            send_event("beads_exercise_finish_succ", {
                "amount": Card.Player.__score.total,
                "total": Card.Player.__score.total
            });

            // Отправляем store
            if (isOld) send_event("$store", get_score_json());
            else send_event("$store", {
                "json": JSON.stringify(get_score_json())
            });

            // Сразу завершаем карточку
            report_solve();
        } else {
            // Если задания уже решены, просто завершаем
            report_solve();
        }
    }

    // ----------------------------------------------------------------------------------
    // Включить автоматическое решение - УСКОРЕННАЯ ВЕРСИЯ
    function solve_all() {
        l_info("Автоматическое решение включено!");
        sessionStorage.setItem('solverUrl', location.href);
        sessionStorage.setItem('doSolve', 'true');
        sessionStorage.removeItem('solved');

        // НЕ ЖДЕМ, решаем сразу все!
        solve_current();
    }

    // ----------------------------------------------------------------------------------
    // Ждем пока AJAX реквест отправится
    function test_count() {
        if (count >= 1) {
            return; // Не перезагружаем страницу
        }
        setTimeout(test_count, 50);
    }

    // ----------------------------------------------------------------------------------
    // Перезагрузить страницу когда AJAX реквест отпарвится
    function reload_on_sent() {
        setTimeout(test_count, 50);
        $(document).ajaxStop(function () {
            count++;
        });
    }

    // ----------------------------------------------------------------------------------
    // Статус
    color = "green";
    let status;

    if (sessionStorage.getItem('doSolve') === 'true'
        && sessionStorage.getItem('solved') !== 'true'
        && sessionStorage.getItem('solverUrl') == location.href) {
        color = "orange";
        status = "Решаем";
    } else if (sessionStorage.getItem('solved') === 'true') {
        status = "Решено";
    } else if (isOld) {
        status = "Поддержка старых заданий";
    } else {
        status = "Готов";
    }

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