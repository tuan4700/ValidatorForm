// Đối tượng cần validator
function Validator(options) {
    var selectorRules = {};

    // Hàm tìm kiếm thẻ cha cần tìm
    function getParent(element, selector) {
        while (element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    // Thực hiện validate
    function validate(inputElement, rule) {
        var errorMessage;
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorMessage);

        // Lấy các rule của selector
        var rules = selectorRules[rule.selector];

        // Lặp qua các rule đã lấy
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            // Kiểm tra rule ? thoát khỏi vòng lặp : tiếp tục kiểm tra rule kế tiếp
            if(errorMessage) break;
        }

        if(errorMessage) {
            errorElement.innerHTML = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerHTML = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMessage;
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault();

            var isFormValid = true;

            options.rules.forEach(function(rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            // Kiểm tra form có lỗi hay không
            if(isFormValid) {
                // Trường hợp submit với JS
                if(typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]');

                    // Lấy value trong input
                    var formValues = Array.from(enableInputs).reduce(function(values, input) {
                        switch (input.type) {
                            case 'checkbox':
                                // Nếu không được check thì bỏ qua input đó
                                if(!input.matches(':checked')) return values;

                                // Nếu không phải là mảng thì khởi tạo mảng rỗng
                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {})

                    options.onSubmit(formValues);
                }
                
                // Trường hợp submit với hành vi mặc định của form (preventDefault)
                else {
                    formElement.submit();
                }
            }
        };

        options.rules.forEach(function(rule) {
            // Lưu Rules vào mảng
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function (inputElement) {
                // Xử lý trường hợp blur khỏi input
                inputElement.onblur = function() {
                    validate(inputElement, rule);
                }

                // Xử lý khi người dùng nhập input
                inputElement.oninput = function() {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorMessage);
                    errorElement.innerHTML = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            })
        });
    }
};


// Định nghĩa rules
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập dữ liệu';
        }
    };
};

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Nhập sai trường dữ liệu';
        }
    };
};

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min? undefined : message || `Nhập tối thiểu ${min} kí tự`;
        }
    };
};

Validator.isConfirmed = function (selector, getValueConfirm, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getValueConfirm() ? undefined : message || 'Vui lòng nhập đúng dữ liệu';
        }
    };
};