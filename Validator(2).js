function Validator(formSelector) {
    var _this = this;
    // Tạo obj chứa các rules
    var formRules = {};

    // Hàm lấy element Parent
    function getParent (element, selector) {
        while (element.parentNode) {
            if (element.parentNode.matches(selector)) {
                return element.parentNode;
            }
            element = element.parentNode;
        }
    }

    var validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập dữ liệu';
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Vui lòng nhập đúng email';
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} ký tự`;
            }
        },
    };

    // Lấy form element cần selector
    var formElement = document.querySelector(formSelector);

    // Xử lý khi form tồn tại
    if (formElement) {
        // Lấy các element input có attribute là name và rules
        var inputs = formElement.querySelectorAll('[name][rules]');
        
        // Lấy giá trị cho formRules
        for (var input of inputs) {
            var rules = input.getAttribute('rules').split("|");
            
            for (var rule of rules) {
                var ruleInfo;
                var isRuleHasValue = rule.includes(':');


                if (isRuleHasValue) {
                    ruleInfo = rule.split(":");
                    rule = ruleInfo[0];
                }
                
                var ruleFunc = validatorRules[rule];
                
                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (blur, change, ...)
            input.onblur = handleValidate;
            input.oninput = handleIsClearError;
        }

        function handleValidate(event) {
            // console.log(formRules[event.target.name]);
            var rules = formRules[event.target.name];
            var errorMessage;
            var formGruop = getParent(event.target, '.form-group');

            // Cách 1 (lấy errorMessage)
            // rules.find(function(rule) {
            //     errorMessage = rule(event.target.value);
            //     return errorMessage;
            // })

            // Cách 2 (lấy errorMessage)
            for (var rule of rules) {
                errorMessage = rule(event.target.value);
                
                if (errorMessage) {
                    break;
                }
            }

            if (errorMessage) {

                // var formGruop = getParent(event.target, '.form-group');
                if (formGruop) {
                    formGruop.classList.add('invalid');
                    var formMessage = formGruop.querySelector('.form-message');
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            // Cách 1 (Clear errorMessage)
            // event.target.oninput = function () {
            //     formGruop.classList.remove('invalid');
            //     var formMessage = formGruop.querySelector('.form-message');
            //     if (formMessage) {
            //         formMessage.innerText = '';
            //     }
            // }

            return errorMessage;

        }

        // Cách 2 (Clear errorMessage)
        function handleIsClearError (event) {
            var formGruop = getParent(event.target, '.form-group');

            if (formGruop.classList.contains('invalid')) {
                formGruop.classList.remove('invalid');
                var formMessage = formGruop.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }

        }
    }

    formElement.onsubmit = function (event) {
        event.preventDefault();        
        var isValid = true;
        var inputs = formElement.querySelectorAll('[name][rules]');
        for (var input of inputs) {
            if (handleValidate({ target: input})) {
                isValid = false;
            }
        }

        if (isValid) {
            if (typeof _this.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]');
                // Lấy value trong input
                var formValues = Array.from(enableInputs).reduce(function(values, input) {
                    // values[input.name] = input.value;
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
                _this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    }



}