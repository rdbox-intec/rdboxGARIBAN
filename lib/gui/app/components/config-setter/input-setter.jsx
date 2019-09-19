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

/* eslint-disable no-magic-numbers */

'use strict'

// eslint-disable-next-line no-unused-vars
const React = require('react')
const propTypes = require('prop-types')
const { default: styled } = require('styled-components')
const {
  ChangeButton,
  DetailsText,
  StepButton,
  StepNameButton,
  ThemedProvider
} = require('../../styled-components')
const { Txt } = require('rendition')
const middleEllipsis = require('../../utils/middle-ellipsis')
const { bytesToClosestUnit } = require('../../../../shared/units')



const InputSetter = (props) => {
  return (
    <ThemedProvider>
      <StepButton
        onClick={props.openConfigSetter}
      >
        Configure
      </StepButton>
    </ThemedProvider>
  )
}

InputSetter.propTypes = {
  openConfigSetter: propTypes.func
}

module.exports = InputSetter
