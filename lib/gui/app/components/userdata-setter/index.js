/*
 * Copyright 2019 RDBOX Prj
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

/**
 * @module Gariban.Components.UserdataSetter
 */

const angular = require('angular')
const { react2angular } = require('react2angular')

const MODULE_NAME = 'Gariban.Components.UdSetter'
const UserdataSetterButton = angular.module(MODULE_NAME, [])

UserdataSetterButton.component(
  'udSetter',
  react2angular(require('./ud-setter.jsx'))
)

module.exports = MODULE_NAME
