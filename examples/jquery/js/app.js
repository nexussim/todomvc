/*global jQuery, Handlebars, Router */
function jquerysucks() {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').innerHTML);
			this.footerTemplate = Handlebars.compile(document.getElementById('footer-template').innerHTML);
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},

		bindEvents: function () {
			// ('.new-todo').on('keyup', this.create.bind(this));
			var newTodo = document.getElementsByClassName('new-todo')[0];
			newTodo.addEventListener('keyup', this.create.bind(this));
			// ('.toggle-all').on('change', this.toggleAll.bind(this));
			var toggleAll = document.getElementById('toggle-all');
     		toggleAll.addEventListener('change', this.toggleAll.bind(this));
			// ('.footer').on('click', '.clear-completed', this.destroyCompleted.bind(this));
			var thisFooter = document.getElementsByClassName('footer')[0];
     		thisFooter.addEventListener('click', function(event) {
       			 var clearCompleted = document.getElementById('clear-completed');
       			 if (event.target === clearCompleted) {
          			App.destroyCompleted(event)
       			 }
      		});
		    var todosUl = document.getElementsByClassName('todo-list')[0];
			var toggleItem = document.getElementsByClassName('toggle');
				todosUl.addEventListener('change', function(event) {
				var elementClicked = event.target;
				    if (elementClicked.className === 'toggle') {
						App.toggle(event);
					}
			});
			  
	     	var todoList = document.getElementsByClassName('todo-list')[0];
			todoList.addEventListener('dblclick', function(event) {
				if (todoList.innerHtml === 'label');
					App.editingMode(event);
			});

			var todoListFocusOut = document.getElementsByClassName('todo-list')[0];
			todoListFocusOut.addEventListener('focusout', function(event) {
				if (event.target.className === 'edit') {
					App.update(event);
				}
			});

			var todoListKeyUp = document.getElementsByClassName('todo-list')[0];
			todoListKeyUp.addEventListener('keyup', function(event) {
				App.editKeyup(event);
			});	  
			var destroyTodo = document.querySelector('ul');
			destroyTodo.addEventListener('click', function(event) {
			    var elementClicked = event.target;
				if (elementClicked.className === 'destroy') {
					App.destroy(event);
				}
			});
		},

		render: function () {
			var todos = this.getFilteredTodos();
			// ('.todo-list').html(this.todoTemplate(todos));
			document.getElementsByClassName('todo-list')[0].innerHTML = this.todoTemplate(todos);
			// ('.main').toggle(todos.length > 0);
			var main = document.getElementsByClassName('main')[0]
				if (todos.length > 0) {
					main.style.display = "block";
				} else {
					main.style.display = "none";
				}

			// ('.toggle-all').prop('checked', this.getActiveTodos().length === 0);
			var toggleAllId = document.getElementById('toggle-all');
				if (this.getActiveTodos().length === 0) {
					toggleAllId.checked = true;
				} else {
					toggleAllId.checked = false;
  			}

			this.renderFooter();
			// ('.new-todo').focus();
			var newTodoFocus = document.getElementsByClassName('new-todo')[0];
			newTodoFocus.focus();
			util.store('todos-jquery', this.todos);
			},

		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			// ('.footer').toggle(todoCount > 0).html(template);
			var showFooter = document.getElementsByClassName('footer')[0];
			showFooter.innerHTML = template;
				if (todoCount > 0) {
			    	showFooter.style.display = "block";
			    } else {
				    showFooter.style.display = "none";
			    }
			},

		toggleAll: function (e) {
			// var isChecked = (e.target).prop('checked');
			var elementClicked = event.target;
			var isChecked = elementClicked.checked;

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},

		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},

		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},

		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}
			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}
			return this.todos;
		},

		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array

		getIndexFromEl: function (el) {
			// var id = (el).closest('li').data('id');
			var id = el.closest('li').getAttribute('data-id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},

		create: function (e) {
			// var input = (e.target);
			var input = e.target;
			// var val = input.val().trim();
			var val = input.value.trim();
			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			input.value = '';

			this.render();
		},

		toggle: function (e) {
			var i = this.getIndexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		editingMode: function (e) {
			// var input = (e.target).closest('li').addClass('editing').find('.edit');
			var input = e.target.closest('li');
			input.classList.add("editing");
			input = document.querySelectorAll('.editing > .edit')[0]
			// puts caret at end of input
			var tmpStr = input.value;
			input.value = '';
			input.value = tmpStr;
			input.focus();
		},

		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			// if (e.which === ESCAPE_KEY) {
			// 	(e.target).data('abort', true).blur();
			// }
			var eventTarget = event.target;
				if (e.which === ESCAPE_KEY) {
  					eventTarget.blur();
				}
			},

		update: function (e) {
			var el = e.target;
			var val = el.value.trim();
			
			if (el.data === 'abort') {
				el.data('abort', false);
			
			} else if (!val) {
				this.destroy(e);
				return;
			} else {
				this.todos[this.getIndexFromEl(el)].title = val;
			}

			this.render();
		},

		destroy: function (e) {
			this.todos.splice(this.getIndexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
}
jquerysucks();
